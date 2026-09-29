import type { GameResult } from '@/domain/session';
import { gameIdOf } from '@/domain/shared';
import { toSeed } from '@/domain/random';

export function resultFixture(
  overrides: Partial<GameResult> & {
    accuracy?: number;
    performanceIndex?: number;
    total?: number;
  } = {},
): GameResult {
  const { accuracy = 0.8, performanceIndex = 72, total = 500, ...rest } = overrides;
  return {
    gameId: gameIdOf('fixture-max'),
    level: 3,
    seed: toSeed(9),
    assisted: false,
    completed: true,
    startedAt: 1000,
    endedAt: 61_000,
    durationMs: 60_000,
    records: [],
    metrics: {
      total: 5,
      attempted: 5,
      correct: 4,
      incorrect: 1,
      timedOut: 0,
      skipped: 0,
      accuracy,
      averageResponseMs: 2000,
      medianResponseMs: 1800,
      fastestResponseMs: 900,
      medianPace: 0.6,
      longestStreak: 3,
      byKind: {},
      bySkill: {},
    },
    score: { total, maxPossible: 1000, performanceIndex },
    recommendation: { level: 3, direction: 'stay', reason: 'Keep practising this level.' },
    ...rest,
  };
}
