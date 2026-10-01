import {
  createLessonSessionState,
  lessonReducer,
  lessonResultOf,
  type ExerciseAnswer,
  type LessonError,
  type LessonId,
  type LessonResult,
  type LessonSessionState,
  type LessonStep,
} from '@/domain/learning';
import { ok, type Result } from '@/domain/shared';
import type { Clock } from '@/domain/time/Clock';

export interface LessonSession {
  readonly getState: () => LessonSessionState;
  readonly submit: (answer: ExerciseAnswer) => Result<void, LessonError>;
  readonly hint: () => Result<void, LessonError>;
  readonly retry: () => Result<void, LessonError>;
  readonly reveal: () => Result<void, LessonError>;
  readonly next: () => Result<void, LessonError>;
  /** Available once the last step is done (lessons only; reviews read the outcomes). */
  readonly getResult: () => LessonResult | null;
  /** Compatible with React's useSyncExternalStore. */
  readonly subscribe: (listener: () => void) => () => void;
}

/** Stateful facade over `lessonReducer`, same pattern as GameSession. */
export function createLessonSession(
  lessonId: LessonId | null,
  steps: readonly LessonStep[],
  clock: Clock,
): LessonSession {
  let state = createLessonSessionState(lessonId, steps, clock.now());
  const listeners = new Set<() => void>();

  const dispatch = (event: Parameters<typeof lessonReducer>[1]): Result<void, LessonError> => {
    const next = lessonReducer(state, event);
    if (!next.ok) return next;
    state = next.value;
    listeners.forEach((listener) => {
      listener();
    });
    return ok(undefined);
  };

  return {
    getState: () => state,
    submit: (answer) => dispatch({ type: 'submit', answer }),
    hint: () => dispatch({ type: 'hint' }),
    retry: () => dispatch({ type: 'retry' }),
    reveal: () => dispatch({ type: 'reveal' }),
    next: () => dispatch({ type: 'continue', at: clock.now() }),
    getResult: () => lessonResultOf(state),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
