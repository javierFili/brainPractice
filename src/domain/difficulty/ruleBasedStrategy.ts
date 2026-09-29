import { stepLevel } from '../shared/difficultyLevel';
import type {
  DifficultyContext,
  DifficultyStrategy,
  LevelRecommendation,
} from './DifficultyStrategy';

export interface RuleBasedThresholds {
  /** Minimum accuracy to move up. */
  readonly promoteAccuracy: number;
  /** Maximum median pace (responseTime / target) to move up. */
  readonly promoteMaxPace: number;
  /** Accuracy below which the level goes down. */
  readonly demoteAccuracy: number;
  /** Fewer attempted challenges than this is not enough evidence to change level. */
  readonly minAttempted: number;
}

export const DEFAULT_THRESHOLDS: RuleBasedThresholds = {
  promoteAccuracy: 0.9,
  promoteMaxPace: 1,
  demoteAccuracy: 0.6,
  minAttempted: 3,
};

/**
 * accuracy ≥ 0.90 AND medianPace ≤ 1   → up
 * accuracy < 0.60                      → down
 * otherwise                            → stay        (clamped to 1–10)
 */
export function createRuleBasedDifficulty(
  overrides: Partial<RuleBasedThresholds> = {},
): DifficultyStrategy {
  const t = { ...DEFAULT_THRESHOLDS, ...overrides };
  if (t.demoteAccuracy > t.promoteAccuracy)
    throw new RangeError('demoteAccuracy must not exceed promoteAccuracy');

  return {
    determineNextLevel({ currentLevel, performance }: DifficultyContext): LevelRecommendation {
      const stay = (reason: string): LevelRecommendation => ({
        level: currentLevel,
        direction: 'stay',
        reason,
      });
      if (performance.attempted < t.minAttempted)
        return stay('Not enough answers to judge this level yet.');

      const { accuracy, medianPace } = performance;
      if (accuracy >= t.promoteAccuracy && medianPace !== null && medianPace <= t.promoteMaxPace) {
        return currentLevel === 10
          ? stay('Top level mastered — keep sharpening your speed.')
          : {
              level: stepLevel(currentLevel, 1),
              direction: 'up',
              reason: 'Accurate and on pace: ready for the next level.',
            };
      }
      if (accuracy < t.demoteAccuracy) {
        return currentLevel === 1
          ? stay('Keep practising the fundamentals.')
          : {
              level: stepLevel(currentLevel, -1),
              direction: 'down',
              reason: 'Consolidate the previous level before moving on.',
            };
      }
      return stay(
        accuracy >= t.promoteAccuracy
          ? 'Accurate — now work on your pace.'
          : 'Keep practising this level.',
      );
    },
  };
}
