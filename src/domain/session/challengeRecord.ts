import type { ChallengePoints } from '../scoring/scoring';
import type { ChallengeId } from '../shared/ids';
import type { Skill } from '../shared/skill';
import type { Answer } from '../challenge/responseFormats';

/**
 * - `correct` / `incorrect`: a valid answer was submitted in time.
 * - `timed-out`: the response limit elapsed (no answer, or an answer that arrived late).
 * - `skipped`: never answered because the session was finished early.
 */
export type ChallengeOutcome = 'correct' | 'incorrect' | 'timed-out' | 'skipped';

export interface ChallengeRecord {
  readonly challengeId: ChallengeId;
  readonly kind: string;
  readonly skills: readonly Skill[];
  readonly outcome: ChallengeOutcome;
  readonly answer: Answer | null;
  readonly attempts: number;
  /** When the challenge was painted; null if it was never shown. */
  readonly presentedAt: number | null;
  /** When the response window opened (after any study phase). */
  readonly respondStartedAt: number | null;
  readonly answeredAt: number | null;
  /** answeredAt − respondStartedAt, only for answers given within the limit. */
  readonly responseTimeMs: number | null;
  /** The challenge's expected response time, kept so pace can be judged per challenge. */
  readonly targetMs: number;
  readonly points: ChallengePoints;
}
