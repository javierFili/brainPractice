import { createStandardScoring } from '../scoring/standardScoring';
import { generateChallenge } from '../game/generateChallenge';
import { gameIdOf } from '../shared/ids';
import { toSeed } from '../random/seed';
import { fixtureGame } from '@/test/fixtures/fixtureGame';
import { buildResult } from './buildResult';
import { createRuleBasedDifficulty } from '../difficulty/ruleBasedStrategy';
import { progress, responseDeadline, runningScore, studyDeadline } from './selectors';
import { sessionReducer } from './sessionReducer';
import { createSessionState, type SessionState } from './sessionState';

const deps = { scoring: createStandardScoring() };
const challenge = generateChallenge(fixtureGame, { level: 1, seed: 3 });
const studied = { ...challenge, timing: { studyMs: 2000, limitMs: 4000, targetMs: 3000 } };
const settings = {
  gameId: gameIdOf('fixture-max'),
  level: 1 as const,
  seed: toSeed(3),
  assisted: false,
};

function step(
  state: SessionState,
  ...events: Parameters<typeof sessionReducer>[1][]
): SessionState {
  return events.reduce((s, event) => {
    const next = sessionReducer(s, event, deps);
    if (!next.ok) throw new Error(next.error.code);
    return next.value;
  }, state);
}

describe('session selectors', () => {
  it('exposes study and response deadlines only in the matching status', () => {
    const initial = createSessionState(settings, [studied], 0);
    expect(studyDeadline(initial)).toBeNull();
    const studying = step(initial, { type: 'presented', at: 100 });
    expect(studyDeadline(studying)).toBe(2100);
    expect(responseDeadline(studying)).toBeNull();
    const responding = step(studying, { type: 'studyEnded', at: 2100 });
    expect(responseDeadline(responding)).toBe(6100);
    expect(
      responseDeadline({ ...responding, settings: { ...settings, assisted: true } }),
    ).toBeNull();
  });

  it('tracks progress and a non-negative running score', () => {
    const initial = createSessionState(settings, [challenge, challenge], 0);
    if (challenge.response.format !== 'single-choice')
      throw new Error('fixture uses single-choice');
    const { options } = challenge.response.question;
    const wrongId =
      options.find(
        (o) =>
          o.id !== (challenge.response as { solution: { optionId: string } }).solution.optionId,
      )?.id ?? '';
    const answered = step(
      initial,
      { type: 'presented', at: 0 },
      { type: 'answered', at: 10, answer: { format: 'single-choice', optionId: wrongId } },
    );
    expect(progress(answered)).toEqual({ completed: 1, total: 2 });
    expect(runningScore(answered)).toBe(0);
  });

  it('rejects a session without challenges and results of unfinished sessions', () => {
    expect(() => createSessionState(settings, [], 0)).toThrow(RangeError);
    expect(() =>
      buildResult(
        createSessionState(settings, [challenge], 0),
        deps.scoring,
        createRuleBasedDifficulty(),
      ),
    ).toThrow(/unfinished/);
  });

  it('rejects answers timestamped before the response window', () => {
    const responding = step(createSessionState(settings, [challenge], 0), {
      type: 'presented',
      at: 500,
    });
    const next = sessionReducer(
      responding,
      { type: 'answered', at: 499, answer: { format: 'single-choice', optionId: 'x' } },
      deps,
    );
    expect(next).toEqual({ ok: false, error: { code: 'TIME_WENT_BACKWARDS' } });
  });
});
