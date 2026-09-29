import type { ChallengeOutcome, ChallengeRecord } from '../session/challengeRecord';
import type { DifficultyLevel } from '../shared/difficultyLevel';

/** Tunable constants of the scoring formulas (documented in ARCHITECTURE.md §7). */
export interface ScoringConfig {
  /** B — base points per challenge. */
  readonly basePoints: number;
  /** k — multiplier increment per level: m(L) = 1 + k·(L − 1). */
  readonly levelStep: number;
  /** Smax — maximum speed bonus as a fraction of the base. */
  readonly maxSpeedBonus: number;
  /** σ — streak bonus per consecutive correct answer before this one. */
  readonly streakStep: number;
  /** σmax — streak bonus cap. */
  readonly maxStreakBonus: number;
  /** r — decay per extra attempt: a = (1 − r)^(attempts − 1). */
  readonly retryDecay: number;
  /** P — penalty for a wrong answer as a fraction of the base. */
  readonly wrongAnswerPenalty: number;
  /** Weight of accuracy in the performance index; speed gets 1 − weight. */
  readonly accuracyWeight: number;
}

export interface ChallengeScoringInput {
  readonly outcome: ChallengeOutcome;
  readonly level: DifficultyLevel;
  readonly responseTimeMs: number | null;
  readonly targetMs: number;
  readonly streakBefore: number;
  readonly attempts: number;
}

/** Full breakdown so the UI can explain every point. */
export interface ChallengePoints {
  readonly difficultyMultiplier: number;
  readonly speedBonus: number;
  readonly streakBonus: number;
  readonly attemptFactor: number;
  readonly penalty: number;
  readonly total: number;
}

export interface SessionScore {
  readonly total: number;
  readonly maxPossible: number;
  /** 0–100 blend of accuracy and speed; the comparable figure across games and levels. */
  readonly performanceIndex: number;
}

export interface ScoringStrategy {
  scoreChallenge(input: ChallengeScoringInput): ChallengePoints;
  scoreSession(records: readonly ChallengeRecord[], level: DifficultyLevel): SessionScore;
}
