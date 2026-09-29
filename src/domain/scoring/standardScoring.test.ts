import type { ChallengeOutcome, ChallengeRecord } from '../session/challengeRecord';
import type { ChallengeScoringInput } from './scoring';
import { createStandardScoring, DEFAULT_SCORING_CONFIG, paceScore } from './standardScoring';

const scoring = createStandardScoring();
const input = (overrides: Partial<ChallengeScoringInput> = {}): ChallengeScoringInput => ({
  outcome: 'correct',
  level: 1,
  responseTimeMs: 5000,
  targetMs: 5000,
  streakBefore: 0,
  attempts: 1,
  ...overrides,
});

function record(
  outcome: ChallengeOutcome,
  responseTimeMs: number | null,
  total: number,
): ChallengeRecord {
  return {
    challengeId: 'g:1:1' as ChallengeRecord['challengeId'],
    kind: 'k',
    skills: ['logical-reasoning'],
    outcome,
    answer: null,
    attempts: 1,
    presentedAt: 0,
    respondStartedAt: 0,
    answeredAt: responseTimeMs,
    responseTimeMs,
    targetMs: 1000,
    points: {
      difficultyMultiplier: 1,
      speedBonus: 0,
      streakBonus: 0,
      attemptFactor: 1,
      penalty: 0,
      total,
    },
  };
}

describe('paceScore', () => {
  it('is 1 at t = 0, 0.5 at half the target, 0 at or beyond the target', () => {
    expect(paceScore(0, 1000)).toBe(1);
    expect(paceScore(500, 1000)).toBe(0.5);
    expect(paceScore(1000, 1000)).toBe(0);
    expect(paceScore(5000, 1000)).toBe(0);
  });
});

describe('StandardScoringStrategy.scoreChallenge', () => {
  it('gives the base points for a correct answer at target pace on level 1', () => {
    expect(scoring.scoreChallenge(input())).toEqual({
      difficultyMultiplier: 1,
      speedBonus: 0,
      streakBonus: 0,
      attemptFactor: 1,
      penalty: 0,
      total: 100,
    });
  });

  it('applies m(L) = 1 + 0.25·(L − 1) from level 1 to level 10', () => {
    expect(scoring.scoreChallenge(input({ level: 10 })).total).toBe(325);
    expect(scoring.scoreChallenge(input({ level: 5 })).difficultyMultiplier).toBe(2);
  });

  it('awards the full speed bonus for an instant answer (t = 0)', () => {
    expect(scoring.scoreChallenge(input({ responseTimeMs: 0 })).total).toBe(150);
  });

  it('caps the streak bonus', () => {
    expect(scoring.scoreChallenge(input({ streakBefore: 2 })).streakBonus).toBe(0.1);
    expect(scoring.scoreChallenge(input({ streakBefore: 50 })).streakBonus).toBe(0.25);
  });

  it('reaches the per-challenge maximum on level 10 with instant answer and full streak', () => {
    expect(
      scoring.scoreChallenge(input({ level: 10, responseTimeMs: 0, streakBefore: 99 })).total,
    ).toBe(568.75);
  });

  it('decays points for extra attempts and rejects invalid attempt counts', () => {
    expect(scoring.scoreChallenge(input({ attempts: 2 })).total).toBe(50);
    expect(() => scoring.scoreChallenge(input({ attempts: 0 }))).toThrow(RangeError);
  });

  it('penalises wrong answers without scaling by level', () => {
    expect(scoring.scoreChallenge(input({ outcome: 'incorrect', level: 10 }))).toMatchObject({
      penalty: 25,
      total: -25,
    });
  });

  it.each<ChallengeOutcome>(['timed-out', 'skipped'])('gives 0 points for %s', (outcome) => {
    expect(scoring.scoreChallenge(input({ outcome, responseTimeMs: null })).total).toBe(0);
  });

  it('accepts partial overrides and validates them', () => {
    const speed = createStandardScoring({ maxSpeedBonus: 1 });
    expect(speed.scoreChallenge(input({ responseTimeMs: 0 })).total).toBe(200);
    expect(() => createStandardScoring({ accuracyWeight: 1.5 })).toThrow(/accuracyWeight/);
    expect(() => createStandardScoring({ basePoints: 0 })).toThrow(/basePoints/);
    expect(() => createStandardScoring({ levelStep: -1 })).toThrow(/levelStep/);
  });

  it('keeps random guessing on 4 options close to zero expected value', () => {
    const { basePoints, wrongAnswerPenalty } = DEFAULT_SCORING_CONFIG;
    const expected =
      0.25 * scoring.scoreChallenge(input()).total - 0.75 * wrongAnswerPenalty * basePoints;
    expect(expected).toBeLessThan(10);
  });
});

describe('StandardScoringStrategy.scoreSession', () => {
  it('scores an empty or fully skipped session as zero', () => {
    expect(scoring.scoreSession([], 1)).toEqual({ total: 0, maxPossible: 0, performanceIndex: 0 });
    expect(scoring.scoreSession([record('skipped', null, 0)], 1).performanceIndex).toBe(0);
  });

  it('never goes below zero', () => {
    const records = [record('incorrect', 100, -25), record('incorrect', 100, -25)];
    expect(scoring.scoreSession(records, 1).total).toBe(0);
  });

  it('computes the maximum possible score with a growing streak', () => {
    const records = [record('correct', 0, 0), record('correct', 0, 0), record('correct', 0, 0)];
    // 100·1·(1.5 + 0) + 100·(1.5 + 0.05) + 100·(1.5 + 0.10)
    expect(scoring.scoreSession(records, 1).maxPossible).toBe(465);
  });

  it('gives 100 for a perfect instant session and weighs accuracy over speed', () => {
    expect(scoring.scoreSession([record('correct', 0, 150)], 3).performanceIndex).toBe(100);
    expect(scoring.scoreSession([record('correct', 1000, 100)], 3).performanceIndex).toBe(75);
  });

  it('only credits speed on correct answers, averaged over all attempts', () => {
    const records = [
      record('correct', 0, 150),
      ...Array.from({ length: 9 }, () => record('incorrect', 0, -25)),
    ];
    // accuracy 0.1, speedIndex 1/10 → 100·(0.075 + 0.025)
    expect(scoring.scoreSession(records, 1).performanceIndex).toBe(10);
  });

  it('counts time-outs as attempted but ignores skipped challenges', () => {
    const records = [
      record('correct', 1000, 100),
      record('timed-out', null, 0),
      record('skipped', null, 0),
    ];
    expect(scoring.scoreSession(records, 1).performanceIndex).toBe(38);
  });
});
