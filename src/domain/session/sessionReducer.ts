import type { Challenge } from '../challenge/challenge';
import { evaluateAnswer, type AnswerError } from '../challenge/evaluateAnswer';
import type { Answer } from '../challenge/responseFormats';
import type { ScoringStrategy } from '../scoring/scoring';
import { err, ok, type Result } from '../shared/result';
import type { ChallengeOutcome, ChallengeRecord } from './challengeRecord';
import { currentChallenge, effectiveLimitMs } from './selectors';
import type { SessionState, SessionStatus } from './sessionState';

/** Time always arrives inside events, so the reducer stays pure and deterministic. */
export type SessionEvent =
  | { readonly type: 'presented'; readonly at: number }
  | { readonly type: 'studyEnded'; readonly at: number }
  | { readonly type: 'answered'; readonly at: number; readonly answer: Answer }
  | { readonly type: 'expired'; readonly at: number }
  | { readonly type: 'advanced'; readonly at: number }
  | { readonly type: 'finished'; readonly at: number };

export type SessionError =
  | { readonly code: 'SESSION_FINISHED' }
  | {
      readonly code: 'INVALID_TRANSITION';
      readonly event: SessionEvent['type'];
      readonly status: SessionStatus;
    }
  | { readonly code: 'INVALID_ANSWER'; readonly reason: AnswerError }
  | { readonly code: 'NOT_EXPIRED'; readonly remainingMs: number }
  | { readonly code: 'TIME_WENT_BACKWARDS' };

export interface SessionDependencies {
  readonly scoring: ScoringStrategy;
}

type Transition<C extends Challenge> = Result<SessionState<C>, SessionError>;

function closeChallenge<C extends Challenge>(
  state: SessionState<C>,
  outcome: ChallengeOutcome,
  at: number | null,
  answer: Answer | null,
  { scoring }: SessionDependencies,
): { record: ChallengeRecord; streak: number } {
  const challenge = currentChallenge(state);
  const { presentedAt, respondStartedAt } = state.current;
  const answeredInTime =
    (outcome === 'correct' || outcome === 'incorrect') && at !== null && respondStartedAt !== null;
  const responseTimeMs = answeredInTime ? at - respondStartedAt : null;
  const attempts = answer === null ? 0 : 1;
  const points = scoring.scoreChallenge({
    outcome,
    level: challenge.level,
    responseTimeMs,
    targetMs: challenge.timing.targetMs,
    streakBefore: state.streak,
    attempts,
  });
  const record: ChallengeRecord = {
    challengeId: challenge.id,
    kind: challenge.content.kind,
    skills: challenge.skills,
    outcome,
    answer,
    attempts,
    presentedAt,
    respondStartedAt,
    answeredAt: answer === null ? null : at,
    responseTimeMs,
    targetMs: challenge.timing.targetMs,
    points,
  };
  return { record, streak: outcome === 'correct' ? state.streak + 1 : 0 };
}

function toFeedback<C extends Challenge>(
  state: SessionState<C>,
  outcome: ChallengeOutcome,
  at: number,
  answer: Answer | null,
  deps: SessionDependencies,
): Transition<C> {
  const { record, streak } = closeChallenge(state, outcome, at, answer, deps);
  return ok({ ...state, status: 'feedback', records: [...state.records, record], streak });
}

function answer<C extends Challenge>(
  state: SessionState<C>,
  event: Extract<SessionEvent, { type: 'answered' }>,
  deps: SessionDependencies,
): Transition<C> {
  const start = state.current.respondStartedAt ?? event.at;
  if (event.at < start) return err({ code: 'TIME_WENT_BACKWARDS' });
  const evaluation = evaluateAnswer(currentChallenge(state).response, event.answer);
  if (!evaluation.ok) return err({ code: 'INVALID_ANSWER', reason: evaluation.error });

  const limit = effectiveLimitMs(state);
  // The limit is enforced here, not by the UI timer: a late answer is a time-out even if the timer lagged.
  const late = limit !== null && event.at - start > limit;
  const outcome: ChallengeOutcome = late ? 'timed-out' : evaluation.value ? 'correct' : 'incorrect';
  return toFeedback(state, outcome, event.at, event.answer, deps);
}

function expire<C extends Challenge>(
  state: SessionState<C>,
  at: number,
  deps: SessionDependencies,
): Transition<C> {
  const limit = effectiveLimitMs(state);
  if (limit === null)
    return err({ code: 'INVALID_TRANSITION', event: 'expired', status: state.status });
  const remainingMs = (state.current.respondStartedAt ?? at) + limit - at;
  if (remainingMs > 0) return err({ code: 'NOT_EXPIRED', remainingMs });
  return toFeedback(state, 'timed-out', at, null, deps);
}

function finish<C extends Challenge>(
  state: SessionState<C>,
  at: number,
  deps: SessionDependencies,
): SessionState<C> {
  const records = [...state.records];
  let { streak } = state;
  for (let index = records.length; index < state.challenges.length; index++) {
    const closed = closeChallenge(
      {
        ...state,
        index,
        streak,
        current:
          index === state.index ? state.current : { presentedAt: null, respondStartedAt: null },
      },
      'skipped',
      null,
      null,
      deps,
    );
    records.push(closed.record);
    streak = closed.streak;
  }
  return { ...state, status: 'finished', records, streak, endedAt: at };
}

/** Pure state machine for a game session. Invalid events are returned as errors, never ignored. */
export function sessionReducer<C extends Challenge>(
  state: SessionState<C>,
  event: SessionEvent,
  deps: SessionDependencies,
): Transition<C> {
  if (state.status === 'finished') return err({ code: 'SESSION_FINISHED' });
  const invalid = () =>
    err({ code: 'INVALID_TRANSITION', event: event.type, status: state.status } as const);

  switch (event.type) {
    case 'presented': {
      if (state.status !== 'presenting') return invalid();
      const studies = currentChallenge(state).timing.studyMs !== null;
      return ok({
        ...state,
        status: studies ? 'studying' : 'responding',
        current: { presentedAt: event.at, respondStartedAt: studies ? null : event.at },
      });
    }
    case 'studyEnded':
      if (state.status !== 'studying') return invalid();
      return ok({
        ...state,
        status: 'responding',
        current: { ...state.current, respondStartedAt: event.at },
      });
    case 'answered':
      return state.status === 'responding' ? answer(state, event, deps) : invalid();
    case 'expired':
      return state.status === 'responding' ? expire(state, event.at, deps) : invalid();
    case 'advanced': {
      if (state.status !== 'feedback') return invalid();
      const isLast = state.index === state.challenges.length - 1;
      if (isLast) return ok({ ...state, status: 'finished', endedAt: event.at });
      return ok({
        ...state,
        status: 'presenting',
        index: state.index + 1,
        current: { presentedAt: null, respondStartedAt: null },
      });
    }
    case 'finished':
      return ok(finish(state, event.at, deps));
  }
}
