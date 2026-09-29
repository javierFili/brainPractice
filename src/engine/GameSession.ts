import type { Answer, Challenge } from '@/domain/challenge';
import type { DifficultyStrategy } from '@/domain/difficulty';
import type { ScoringStrategy } from '@/domain/scoring';
import {
  buildResult,
  lastRecord,
  sessionReducer,
  type ChallengeRecord,
  type GameResult,
  type SessionError,
  type SessionEvent,
  type SessionState,
} from '@/domain/session';
import { err, ok, type Result } from '@/domain/shared';
import type { Clock } from '@/domain/time/Clock';

export interface GameSession<C extends Challenge = Challenge> {
  readonly getState: () => SessionState<C>;
  /** Call once the current challenge is visible (after paint) to start measuring. */
  readonly present: () => Result<void, SessionError>;
  readonly endStudy: () => Result<void, SessionError>;
  readonly submitAnswer: (answer: Answer) => Result<ChallengeRecord, SessionError>;
  /** Asks the session to time out the current challenge; rejected with NOT_EXPIRED if too early. */
  readonly expire: () => Result<ChallengeRecord, SessionError>;
  readonly advance: () => Result<void, SessionError>;
  /** Finishes (early if needed) and returns the result. Idempotent. */
  readonly finish: () => GameResult;
  /** Available once the session has finished. */
  readonly getResult: () => GameResult | null;
  /** Compatible with React's useSyncExternalStore. */
  readonly subscribe: (listener: () => void) => () => void;
}

export interface GameSessionDependencies {
  readonly clock: Clock;
  readonly scoring: ScoringStrategy;
  readonly difficulty: DifficultyStrategy;
}

/** Stateful facade over the pure reducer: stamps events with the clock and notifies subscribers. */
export function createGameSession<C extends Challenge>(
  initial: SessionState<C>,
  { clock, scoring, difficulty }: GameSessionDependencies,
): GameSession<C> {
  let state = initial;
  let result: GameResult | null = null;
  const listeners = new Set<() => void>();

  function dispatch(event: SessionEvent): Result<SessionState<C>, SessionError> {
    const next = sessionReducer(state, event, { scoring });
    if (next.ok) {
      state = next.value;
      if (state.status === 'finished') result ??= buildResult(state, scoring, difficulty);
      listeners.forEach((listener) => {
        listener();
      });
    }
    return next;
  }

  const run = (type: 'presented' | 'studyEnded' | 'advanced'): Result<void, SessionError> => {
    const next = dispatch({ type, at: clock.now() });
    return next.ok ? ok(undefined) : next;
  };

  const closing = (event: SessionEvent): Result<ChallengeRecord, SessionError> => {
    const next = dispatch(event);
    if (!next.ok) return next;
    const record = lastRecord(next.value);
    return record ? ok(record) : err({ code: 'SESSION_FINISHED' });
  };

  return {
    getState: () => state,
    present: () => run('presented'),
    endStudy: () => run('studyEnded'),
    advance: () => run('advanced'),
    submitAnswer: (answer) => closing({ type: 'answered', at: clock.now(), answer }),
    expire: () => closing({ type: 'expired', at: clock.now() }),
    finish() {
      if (state.status !== 'finished') dispatch({ type: 'finished', at: clock.now() });
      // Safe: dispatching `finished` from any non-finished state always succeeds and builds the result.
      return result as GameResult;
    },
    getResult: () => result,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
