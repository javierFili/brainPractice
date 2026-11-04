import type { PerformanceMetrics } from '../session/performanceMetrics';
import type { DifficultyLevel } from '../shared/difficultyLevel';
import type { Text } from '../shared/text';

export interface LevelRecommendation {
  readonly level: DifficultyLevel;
  readonly direction: 'up' | 'stay' | 'down';
  /** Short explanation shown to the player. */
  readonly reason: Text;
}

export interface DifficultyContext {
  readonly currentLevel: DifficultyLevel;
  readonly performance: PerformanceMetrics;
}

/** Decides the next level from observed performance. Swappable (rule-based today, staircase/Elo later). */
export interface DifficultyStrategy {
  determineNextLevel(context: DifficultyContext): LevelRecommendation;
}
