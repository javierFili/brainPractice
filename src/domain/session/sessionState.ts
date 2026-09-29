import type { Challenge } from '../challenge/challenge';
import type { Seed } from '../random/seed';
import type { DifficultyLevel } from '../shared/difficultyLevel';
import type { GameId } from '../shared/ids';
import type { ChallengeRecord } from './challengeRecord';

/**
 * presenting → (studying →) responding → feedback → presenting(next) … → finished
 * `finish` is allowed from any non-finished status (remaining challenges become `skipped`).
 */
export type SessionStatus = 'presenting' | 'studying' | 'responding' | 'feedback' | 'finished';

export interface SessionSettings {
  readonly gameId: GameId;
  readonly level: DifficultyLevel;
  readonly seed: Seed;
  /** Accessible mode: response time limits are lifted and the result is flagged. */
  readonly assisted: boolean;
}

export interface CurrentTiming {
  readonly presentedAt: number | null;
  readonly respondStartedAt: number | null;
}

export interface SessionState<C extends Challenge = Challenge> {
  readonly status: SessionStatus;
  readonly settings: SessionSettings;
  readonly challenges: readonly C[];
  /** Index of the challenge being played (or last played once finished). */
  readonly index: number;
  /** One record per completed challenge, in order. */
  readonly records: readonly ChallengeRecord[];
  readonly current: CurrentTiming;
  /** Consecutive correct answers so far. */
  readonly streak: number;
  readonly startedAt: number;
  readonly endedAt: number | null;
}

export function createSessionState<C extends Challenge>(
  settings: SessionSettings,
  challenges: readonly C[],
  startedAt: number,
): SessionState<C> {
  if (challenges.length === 0) throw new RangeError('A session needs at least one challenge');
  return {
    status: 'presenting',
    settings,
    challenges,
    index: 0,
    records: [],
    current: { presentedAt: null, respondStartedAt: null },
    streak: 0,
    startedAt,
    endedAt: null,
  };
}
