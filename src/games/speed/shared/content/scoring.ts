import type { ScoringConfig } from '@/domain/scoring';

/**
 * Scoring for speed games: a fast correct answer can double its points, but a wrong answer still
 * costs points and accuracy keeps 60 % of the performance index. Speed only ever counts on correct
 * answers (standard scoring), so guessing fast never beats answering right.
 */
export const SPEED_SCORING: Partial<ScoringConfig> = { maxSpeedBonus: 1, accuracyWeight: 0.6 };
