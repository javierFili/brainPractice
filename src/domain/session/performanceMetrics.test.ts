import { gameIdOf, challengeIdOf } from '../shared/ids';
import { toSeed } from '../random/seed';
import type { ChallengeOutcome, ChallengeRecord } from './challengeRecord';
import { computeMetrics } from './performanceMetrics';

const noPoints = {
  difficultyMultiplier: 1,
  speedBonus: 0,
  streakBonus: 0,
  attemptFactor: 1,
  penalty: 0,
  total: 0,
};

let n = 0;
function record(
  outcome: ChallengeOutcome,
  responseTimeMs: number | null,
  overrides: Partial<ChallengeRecord> = {},
): ChallengeRecord {
  n += 1;
  return {
    challengeId: challengeIdOf(gameIdOf('fixture'), 1, toSeed(n)),
    kind: 'trace',
    skills: ['logical-reasoning'],
    outcome,
    answer: null,
    attempts: outcome === 'skipped' ? 0 : 1,
    presentedAt: 0,
    respondStartedAt: 0,
    answeredAt: responseTimeMs,
    responseTimeMs,
    targetMs: 1000,
    points: noPoints,
    ...overrides,
  };
}

describe('computeMetrics', () => {
  it('handles an empty session without NaN', () => {
    expect(computeMetrics([])).toEqual({
      total: 0,
      attempted: 0,
      correct: 0,
      incorrect: 0,
      timedOut: 0,
      skipped: 0,
      accuracy: 0,
      averageResponseMs: null,
      medianResponseMs: null,
      fastestResponseMs: null,
      medianPace: null,
      medianReactionMs: null,
      longestStreak: 0,
      byKind: {},
      bySkill: {},
    });
  });

  it('computes a perfect session', () => {
    const metrics = computeMetrics([
      record('correct', 1000),
      record('correct', 3000),
      record('correct', 2000),
    ]);
    expect(metrics).toMatchObject({
      accuracy: 1,
      averageResponseMs: 2000,
      medianResponseMs: 2000,
      fastestResponseMs: 1000,
      medianPace: 2,
      longestStreak: 3,
    });
  });

  it('counts time-outs as attempted failures but excludes skipped challenges', () => {
    const metrics = computeMetrics([
      record('correct', 1000),
      record('incorrect', 3000),
      record('timed-out', null),
      record('skipped', null),
    ]);
    expect(metrics).toMatchObject({
      total: 4,
      attempted: 3,
      correct: 1,
      incorrect: 1,
      timedOut: 1,
      skipped: 1,
    });
    expect(metrics.accuracy).toBeCloseTo(1 / 3);
    expect(metrics.averageResponseMs).toBe(2000);
    expect(metrics.medianResponseMs).toBe(2000);
  });

  it('uses the mean of the two middle values as median for even counts', () => {
    const metrics = computeMetrics([
      record('correct', 100),
      record('correct', 400),
      record('incorrect', 200),
      record('correct', 9000),
    ]);
    expect(metrics.medianResponseMs).toBe(300);
  });

  it('judges pace against each challenge target', () => {
    const metrics = computeMetrics([
      record('correct', 500, { targetMs: 1000 }),
      record('correct', 3000, { targetMs: 2000 }),
      record('incorrect', 8000, { targetMs: 2000 }),
    ]);
    expect(metrics.medianPace).toBe(1.5);
  });

  it('accepts a zero response time', () => {
    expect(computeMetrics([record('correct', 0)])).toMatchObject({
      averageResponseMs: 0,
      fastestResponseMs: 0,
    });
  });

  it('breaks streaks on incorrect and timed-out answers', () => {
    const outcomes: ChallengeOutcome[] = [
      'correct',
      'correct',
      'timed-out',
      'correct',
      'correct',
      'correct',
      'incorrect',
      'correct',
    ];
    expect(
      computeMetrics(outcomes.map((o) => record(o, o === 'timed-out' ? null : 10))).longestStreak,
    ).toBe(3);
  });

  it('reports all-skipped (abandoned) sessions as nothing attempted', () => {
    expect(computeMetrics([record('skipped', null), record('skipped', null)])).toMatchObject({
      attempted: 0,
      accuracy: 0,
      byKind: {},
    });
  });

  it('breaks results down by challenge kind and skill, ignoring skipped ones', () => {
    const metrics = computeMetrics([
      record('correct', 10, { kind: 'trace', skills: ['logical-reasoning', 'working-memory'] }),
      record('incorrect', 10, {
        kind: 'order',
        skills: ['algorithmic-thinking', 'algorithmic-thinking'],
      }),
      record('correct', 10, { kind: 'order', skills: ['algorithmic-thinking'] }),
      record('skipped', null, { kind: 'constraints', skills: ['decomposition'] }),
    ]);
    expect(metrics.byKind).toEqual({
      trace: { total: 1, correct: 1 },
      order: { total: 2, correct: 1 },
    });
    expect(metrics.bySkill).toEqual({
      'logical-reasoning': { total: 1, correct: 1 },
      'working-memory': { total: 1, correct: 1 },
      'algorithmic-thinking': { total: 2, correct: 1 },
    });
  });

  it('reports the median reaction time of correct taps only', () => {
    const tap = (reactionMs: number | null) =>
      ({ format: 'tap', tapped: reactionMs !== null, reactionMs }) as const;
    const metrics = computeMetrics([
      record('correct', 900, { answer: tap(300) }),
      record('correct', 700, { answer: tap(200) }),
      record('incorrect', 100, { answer: tap(-50) }),
      record('correct', 2000, { answer: tap(null) }),
      record('correct', 2000, { answer: tap(400) }),
    ]);
    expect(metrics.medianReactionMs).toBe(300);
  });
});
