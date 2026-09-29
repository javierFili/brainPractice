import type { Answer } from '@/domain/challenge';
import { createGameRegistry } from '@/domain/game';
import { gameIdOf } from '@/domain/shared';
import { FakeClock } from '@/test/fakes/FakeClock';
import { FixedSeedSource } from '@/test/fakes/FixedSeedSource';
import { fixtureGame, type FixtureChallenge } from '@/test/fixtures/fixtureGame';
import {
  createGameEngine,
  InvalidSessionConfigError,
  UnknownGameError,
  type SessionConfig,
} from './GameEngine';
import type { GameSession } from './GameSession';

const studyGame = {
  ...fixtureGame,
  id: gameIdOf('fixture-study'),
  levels: Object.fromEntries(
    Object.entries(fixtureGame.levels).map(([level, profile]) => [
      level,
      { ...profile, timing: { studyMs: 3000, limitMs: 10_000, targetMs: 5000 } },
    ]),
  ) as typeof fixtureGame.levels,
};

function setup(config: Partial<SessionConfig> = {}, defaultCount = false) {
  const clock = new FakeClock();
  const engine = createGameEngine({
    registry: createGameRegistry([fixtureGame, studyGame]),
    clock,
    seeds: new FixedSeedSource(777),
  });
  const base = {
    gameId: 'fixture-max',
    level: 3 as const,
    ...(defaultCount ? {} : { challengeCount: 3 }),
  };
  const session = engine.startSession({ ...base, ...config }) as GameSession<FixtureChallenge>;
  return { clock, engine, session };
}

const current = (session: GameSession<FixtureChallenge>) =>
  session.getState().challenges[session.getState().index] as FixtureChallenge;

function answerFor(session: GameSession<FixtureChallenge>, correct: boolean): Answer {
  const { response } = current(session);
  if (response.format !== 'single-choice') throw new Error('fixture uses single-choice');
  const option = response.question.options.find(
    (o) => (o.id === response.solution.optionId) === correct,
  );
  return { format: 'single-choice', optionId: option?.id ?? '' };
}

describe('GameEngine.startSession', () => {
  it('generates the requested number of reproducible challenges from the session seed', () => {
    const a = setup({ seed: 42 }).session.getState();
    const b = setup({ seed: 42 }).session.getState();
    expect(a.challenges).toHaveLength(3);
    expect(a.challenges).toEqual(b.challenges);
    expect(new Set(a.challenges.map((c) => c.id)).size).toBe(3);
    expect(a.settings).toEqual({ gameId: 'fixture-max', level: 3, seed: 42, assisted: false });
  });

  it('draws a seed from the SeedSource when none is given and defaults to the level challenge count', () => {
    const state = setup({}, true).session.getState();
    expect(state.settings.seed).toBe(777);
    expect(state.challenges).toHaveLength(fixtureGame.levels[3].challengeCount);
  });

  it('starts in the presenting status at the clock time', () => {
    expect(setup().session.getState()).toMatchObject({
      status: 'presenting',
      index: 0,
      startedAt: 1000,
      records: [],
    });
  });

  it('rejects unknown games, invalid levels, counts and seeds', () => {
    expect(() => setup({ gameId: 'nope' })).toThrow(UnknownGameError);
    expect(() => setup({ level: 11 as 10 })).toThrow(InvalidSessionConfigError);
    expect(() => setup({ challengeCount: 0 })).toThrow(InvalidSessionConfigError);
    expect(() => setup({ challengeCount: 101 })).toThrow(InvalidSessionConfigError);
    expect(() => setup({ seed: -5 })).toThrow(/Seed/);
  });
});

describe('GameSession', () => {
  it('plays a full session: correct, incorrect, time-out → result', () => {
    const { clock, session } = setup();

    expect(session.present().ok).toBe(true);
    clock.advance(2000);
    const first = session.submitAnswer(answerFor(session, true));
    expect(first).toMatchObject({ ok: true, value: { outcome: 'correct', responseTimeMs: 2000 } });
    expect(session.getState()).toMatchObject({ status: 'feedback', streak: 1 });

    clock.advance(4000); // reading feedback does not count
    session.advance();
    session.present();
    clock.advance(1500);
    expect(session.submitAnswer(answerFor(session, false))).toMatchObject({
      ok: true,
      value: { outcome: 'incorrect', responseTimeMs: 1500 },
    });
    expect(session.getState().streak).toBe(0);

    session.advance();
    session.present();
    clock.advance(10_000);
    expect(session.expire()).toMatchObject({
      ok: true,
      value: { outcome: 'timed-out', responseTimeMs: null },
    });
    expect(session.getResult()).toBeNull();

    session.advance();
    const result = session.getResult();
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      completed: true,
      level: 3,
      seed: 777,
      startedAt: 1000,
      endedAt: 1000 + 2000 + 4000 + 1500 + 10_000,
      metrics: { correct: 1, incorrect: 1, timedOut: 1, attempted: 3 },
      recommendation: { direction: 'down' },
    });
    expect(session.getState().status).toBe('finished');
  });

  it('treats an answer arriving after the limit as a time-out even if the UI timer lagged', () => {
    const { clock, session } = setup();
    session.present();
    clock.advance(10_001);
    expect(session.submitAnswer(answerFor(session, true))).toMatchObject({
      ok: true,
      value: { outcome: 'timed-out', responseTimeMs: null, points: { total: 0 } },
    });
  });

  it('accepts an answer exactly at the limit', () => {
    const { clock, session } = setup();
    session.present();
    clock.advance(10_000);
    expect(session.submitAnswer(answerFor(session, true))).toMatchObject({
      ok: true,
      value: { outcome: 'correct' },
    });
  });

  it('rejects an early expire with the remaining time', () => {
    const { clock, session } = setup();
    session.present();
    clock.advance(9_000);
    expect(session.expire()).toEqual({
      ok: false,
      error: { code: 'NOT_EXPIRED', remainingMs: 1000 },
    });
    expect(session.getState().status).toBe('responding');
  });

  it('lifts time limits in assisted mode', () => {
    const { clock, session } = setup({ assisted: true });
    session.present();
    clock.advance(60_000);
    expect(session.expire()).toMatchObject({ ok: false, error: { code: 'INVALID_TRANSITION' } });
    expect(session.submitAnswer(answerFor(session, true))).toMatchObject({
      ok: true,
      value: { outcome: 'correct' },
    });
    expect(session.finish().assisted).toBe(true);
  });

  it('measures response time from the end of the study phase', () => {
    const { clock, session } = setup({ gameId: 'fixture-study' });
    session.present();
    expect(session.getState().status).toBe('studying');
    expect(session.submitAnswer(answerFor(session, true))).toMatchObject({
      ok: false,
      error: { code: 'INVALID_TRANSITION', status: 'studying' },
    });
    clock.advance(3000);
    session.endStudy();
    clock.advance(800);
    expect(session.submitAnswer(answerFor(session, true))).toMatchObject({
      ok: true,
      value: { responseTimeMs: 800 },
    });
  });

  it('refuses double submissions and malformed answers without recording them', () => {
    const { session } = setup();
    session.present();
    expect(session.submitAnswer({ format: 'single-choice', optionId: 'missing' })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_ANSWER', reason: { code: 'UNKNOWN_OPTION' } },
    });
    expect(session.submitAnswer({ format: 'numeric', value: 1 })).toMatchObject({
      ok: false,
      error: { reason: { code: 'FORMAT_MISMATCH' } },
    });
    expect(session.getState().records).toHaveLength(0);
    session.submitAnswer(answerFor(session, true));
    expect(session.submitAnswer(answerFor(session, true))).toMatchObject({
      ok: false,
      error: { code: 'INVALID_TRANSITION', status: 'feedback' },
    });
    expect(session.getState().records).toHaveLength(1);
  });

  it('rejects out-of-order commands', () => {
    const { session } = setup();
    expect(session.advance()).toMatchObject({
      ok: false,
      error: { code: 'INVALID_TRANSITION', event: 'advanced' },
    });
    expect(session.endStudy()).toMatchObject({ ok: false });
    session.present();
    expect(session.present()).toMatchObject({ ok: false, error: { code: 'INVALID_TRANSITION' } });
  });

  it('finishes early, skipping the rest, and becomes read-only', () => {
    const { clock, session } = setup();
    session.present();
    session.submitAnswer(answerFor(session, true));
    session.advance();
    session.present();
    clock.advance(500);
    const result = session.finish();
    expect(result.completed).toBe(false);
    expect(result.records.map((r) => r.outcome)).toEqual(['correct', 'skipped', 'skipped']);
    expect(result.records[1]?.presentedAt).toBe(1000);
    expect(result.records[2]?.presentedAt).toBeNull();
    expect(session.finish()).toBe(result);
    expect(session.present()).toEqual({ ok: false, error: { code: 'SESSION_FINISHED' } });
    expect(session.submitAnswer(answerFor(session, true))).toEqual({
      ok: false,
      error: { code: 'SESSION_FINISHED' },
    });
  });

  it('finishing during feedback on the last challenge counts as completed', () => {
    const { session } = setup({ challengeCount: 1 });
    session.present();
    session.submitAnswer(answerFor(session, true));
    expect(session.finish()).toMatchObject({ completed: true, metrics: { correct: 1 } });
  });

  it('notifies subscribers on every successful transition only', () => {
    const { session } = setup();
    const listener = vi.fn();
    const unsubscribe = session.subscribe(listener);
    session.present();
    session.present(); // invalid → no notification
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    session.submitAnswer(answerFor(session, true));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps previous snapshots immutable', () => {
    const { session } = setup();
    const before = session.getState();
    session.present();
    expect(before.status).toBe('presenting');
    expect(session.getState()).not.toBe(before);
  });

  it('applies the game scoring overrides', () => {
    const clock = new FakeClock();
    const fast = { ...fixtureGame, id: gameIdOf('fixture-fast'), scoring: { maxSpeedBonus: 1 } };
    const engine = createGameEngine({
      registry: createGameRegistry([fast]),
      clock,
      seeds: new FixedSeedSource(1),
    });
    const session = engine.startSession({
      gameId: 'fixture-fast',
      level: 1,
      challengeCount: 1,
    }) as GameSession<FixtureChallenge>;
    session.present();
    expect(session.submitAnswer(answerFor(session, true))).toMatchObject({
      ok: true,
      value: { points: { total: 200 } },
    });
  });
});
