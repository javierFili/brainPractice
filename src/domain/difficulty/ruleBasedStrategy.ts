import { stepLevel } from '../shared/difficultyLevel';
import { msg, type Text } from '../shared/text';
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
      const stay = (reason: Text): LevelRecommendation => ({
        level: currentLevel,
        direction: 'stay',
        reason,
      });
      if (performance.attempted < t.minAttempted)
        return stay(msg('play:results.reasons.notEnough'));

      const { accuracy, medianPace } = performance;
      if (accuracy >= t.promoteAccuracy && medianPace !== null && medianPace <= t.promoteMaxPace) {
        return currentLevel === 10
          ? stay(msg('play:results.reasons.topMastered'))
          : {
              level: stepLevel(currentLevel, 1),
              direction: 'up',
              reason: msg('play:results.reasons.ready'),
            };
      }
      if (accuracy < t.demoteAccuracy) {
        return currentLevel === 1
          ? stay(msg('play:results.reasons.fundamentals'))
          : {
              level: stepLevel(currentLevel, -1),
              direction: 'down',
              reason: msg('play:results.reasons.consolidate'),
            };
      }
      return stay(
        accuracy >= t.promoteAccuracy
          ? msg('play:results.reasons.pace')
          : msg('play:results.reasons.keepPractising'),
      );
    },
  };
}
