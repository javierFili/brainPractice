import type { LevelRecommendation } from '../difficulty/DifficultyStrategy';
import type { Seed } from '../random/seed';
import type { SessionScore } from '../scoring/scoring';
import type { DifficultyLevel } from '../shared/difficultyLevel';
import type { GameId } from '../shared/ids';
import type { ChallengeRecord } from './challengeRecord';
import type { PerformanceMetrics } from './performanceMetrics';

/** Immutable summary of a finished session; the unit that is persisted and displayed. */
export interface GameResult {
  readonly gameId: GameId;
  readonly level: DifficultyLevel;
  readonly seed: Seed;
  /** Accessible mode without time limits; excluded from records. */
  readonly assisted: boolean;
  /** False when the session was finished before the last challenge. */
  readonly completed: boolean;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly durationMs: number;
  readonly records: readonly ChallengeRecord[];
  readonly metrics: PerformanceMetrics;
  readonly score: SessionScore;
  readonly recommendation: LevelRecommendation;
}
