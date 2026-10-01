import type { Challenge } from '../challenge/challenge';
import type { SessionState } from './sessionState';

export const currentChallenge = <C extends Challenge>(state: SessionState<C>): C =>
  state.challenges[state.index] as C;

/** Response limit in effect for the current challenge (none in assisted mode). */
export const effectiveLimitMs = (state: SessionState): number | null =>
  state.settings.assisted ? null : currentChallenge(state).timing.limitMs;

/** Relaxed (assisted) sessions double the memorisation time instead of removing it. */
export const ASSISTED_STUDY_FACTOR = 2;

/** Memorisation time in effect for the current challenge; null when it has no study phase. */
export function effectiveStudyMs(state: SessionState): number | null {
  const { studyMs } = currentChallenge(state).timing;
  if (studyMs === null) return null;
  return state.settings.assisted ? studyMs * ASSISTED_STUDY_FACTOR : studyMs;
}

/** Absolute time at which the study phase ends, when studying. */
export function studyDeadline(state: SessionState): number | null {
  const studyMs = effectiveStudyMs(state);
  const { presentedAt } = state.current;
  return state.status === 'studying' && studyMs !== null && presentedAt !== null
    ? presentedAt + studyMs
    : null;
}

/** Absolute time at which the answer times out, when responding under a limit. */
export function responseDeadline(state: SessionState): number | null {
  const limit = effectiveLimitMs(state);
  const { respondStartedAt } = state.current;
  return state.status === 'responding' && limit !== null && respondStartedAt !== null
    ? respondStartedAt + limit
    : null;
}

export const lastRecord = (state: SessionState) => state.records.at(-1) ?? null;

export const runningScore = (state: SessionState) =>
  Math.max(
    0,
    state.records.reduce((sum, record) => sum + record.points.total, 0),
  );

export const progress = (state: SessionState) => ({
  completed: state.records.length,
  total: state.challenges.length,
});
