import { resultFixture } from '@/test/fixtures/results';
import { scoreAssessment } from '../assessment/assessment';
import {
  applyAssessmentResult,
  applySessionResult,
  emptyProgress,
  isLevelCleared,
  MAX_RECENT_SESSIONS,
  suggestedLevel,
} from './progress';
import { isUserProgress, recoverUserProgress } from './progressGuards';

describe('applySessionResult', () => {
  it('records the first completed session of a level', () => {
    const progress = applySessionResult(emptyProgress(), resultFixture());
    expect(progress.games['fixture-max']?.[3]).toEqual({
      plays: 1,
      bestScore: 500,
      bestAccuracy: 0.8,
      bestPerformanceIndex: 72,
      bestMedianResponseMs: 1800,
      lastPlayedAt: 61_000,
    });
    expect(progress.recentSessions).toHaveLength(1);
    expect(isUserProgress(progress)).toBe(true);
  });

  it('keeps the best values across plays (lower median time is better)', () => {
    const first = applySessionResult(
      emptyProgress(),
      resultFixture({ total: 900, accuracy: 0.6, performanceIndex: 50 }),
    );
    const second = applySessionResult(
      first,
      resultFixture({ total: 300, accuracy: 1, performanceIndex: 90, endedAt: 99_000 }),
    );
    expect(second.games['fixture-max']?.[3]).toMatchObject({
      plays: 2,
      bestScore: 900,
      bestAccuracy: 1,
      bestPerformanceIndex: 90,
      lastPlayedAt: 99_000,
    });
    expect(second.recentSessions[0]?.endedAt).toBe(99_000);
  });

  it('lists but does not count incomplete sessions', () => {
    const progress = applySessionResult(emptyProgress(), resultFixture({ completed: false }));
    expect(progress.games).toEqual({});
    expect(progress.recentSessions[0]?.completed).toBe(false);
  });

  it('counts assisted sessions as plays without setting records', () => {
    const progress = applySessionResult(
      emptyProgress(),
      resultFixture({ assisted: true, total: 999 }),
    );
    expect(progress.games['fixture-max']?.[3]).toMatchObject({
      plays: 1,
      bestScore: 0,
      bestPerformanceIndex: 0,
      bestMedianResponseMs: null,
    });
  });

  it('caps the recent sessions list', () => {
    let progress = emptyProgress();
    for (let i = 0; i < MAX_RECENT_SESSIONS + 5; i++)
      progress = applySessionResult(progress, resultFixture({ endedAt: i }));
    expect(progress.recentSessions).toHaveLength(MAX_RECENT_SESSIONS);
    expect(progress.recentSessions[0]?.endedAt).toBe(MAX_RECENT_SESSIONS + 4);
  });

  it('does not mutate the previous progress', () => {
    const before = emptyProgress();
    applySessionResult(before, resultFixture());
    expect(before).toEqual(emptyProgress());
  });
});

describe('level clearing and suggestion', () => {
  it('clears a level at a performance index of 70', () => {
    expect(isLevelCleared(undefined)).toBe(false);
    const at = (performanceIndex: number) =>
      applySessionResult(emptyProgress(), resultFixture({ performanceIndex })).games[
        'fixture-max'
      ]?.[3];
    expect(isLevelCleared(at(69))).toBe(false);
    expect(isLevelCleared(at(70))).toBe(true);
  });

  it('suggests the level after the highest cleared one, clamped to 10', () => {
    expect(suggestedLevel(undefined)).toBe(1);
    const record = {
      plays: 1,
      bestScore: 1,
      bestAccuracy: 1,
      bestPerformanceIndex: 80,
      bestMedianResponseMs: null,
      lastPlayedAt: 0,
    };
    expect(suggestedLevel({ 1: record, 4: record })).toBe(5);
    expect(suggestedLevel({ 10: record })).toBe(10);
  });
});

describe('isUserProgress', () => {
  const valid = applySessionResult(emptyProgress(), resultFixture());
  it.each([
    ['null', null],
    ['array', []],
    ['wrong version', { ...valid, schemaVersion: 2 }],
    ['bad sessions', { ...valid, recentSessions: [{ gameId: 1 }] }],
    ['bad level key', { ...valid, games: { g: { 11: valid.games['fixture-max']?.[3] } } }],
    ['bad record', { ...valid, games: { g: { 1: { plays: 'x' } } } }],
    ['bad seed', { ...valid, recentSessions: [{ ...valid.recentSessions[0], seed: -1 }] }],
  ])('rejects %s', (_, value) => {
    expect(isUserProgress(value)).toBe(false);
  });
});

describe('applyAssessmentResult', () => {
  const definition = {
    id: 'pci',
    name: 'PCI',
    sections: [
      { area: 'logic' as const, gameId: 'g', levels: [3 as const], challengesPerLevel: 2 },
    ],
  };
  const step = {
    index: 0,
    area: 'logic' as const,
    gameId: 'g',
    level: 3 as const,
    challengeCount: 2,
  };
  const result = scoreAssessment(
    definition,
    [{ step, result: resultFixture({ performanceIndex: 64 }) }],
    0,
    500,
  );

  it('stores a summary of measured areas without touching level records', () => {
    const progress = applyAssessmentResult(emptyProgress(), result);
    expect(progress.assessments).toEqual([
      { assessmentId: 'pci', endedAt: 500, overall: 64, areas: { logic: 64 } },
    ]);
    expect(progress.games).toEqual({});
    expect(isUserProgress(progress)).toBe(true);
  });

  it('accepts progress saved before assessments existed and rejects malformed summaries', () => {
    expect(isUserProgress(emptyProgress())).toBe(true);
    expect(
      isUserProgress({
        ...emptyProgress(),
        assessments: [{ assessmentId: 'x', endedAt: 1, overall: 1, areas: { iq: 3 } }],
      }),
    ).toBe(false);
  });
});

describe('recoverUserProgress', () => {
  const intact = applySessionResult(emptyProgress(), resultFixture());

  it('returns intact progress unchanged with nothing discarded', () => {
    expect(recoverUserProgress(intact)).toEqual({ value: intact, discarded: 0 });
  });

  it('keeps every valid entry and counts the damaged ones', () => {
    const damaged = {
      ...intact,
      recentSessions: [...intact.recentSessions, { gameId: 1 }, null],
      games: {
        ...intact.games,
        other: { 2: { plays: 'x' }, 11: intact.games['fixture-max']?.[3] },
      },
      assessments: [{ assessmentId: 'a', endedAt: 1, overall: 50, areas: { iq: 3 } }],
    };
    const recovered = recoverUserProgress(damaged);
    expect(recovered?.discarded).toBe(5);
    expect(recovered?.value).toEqual({ ...intact, assessments: [] });
    expect(isUserProgress(recovered?.value)).toBe(true);
  });

  it.each([null, 'text', [], { schemaVersion: 2, games: {}, recentSessions: [] }])(
    'gives up on %j (not an object, or another schema version)',
    (value) => {
      expect(recoverUserProgress(value)).toBeNull();
    },
  );
});
