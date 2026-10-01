import { err, ok, type Result } from '../shared/result';
import type { ExercisePhase, LessonStep } from './content';
import { evaluateExercise, type AnswerError, type Evaluation } from './evaluate';
import type { Exercise, ExerciseAnswer } from './exercise';
import type { LessonId } from './ids';
import { effectiveCredit } from './mastery';
import { LESSON_PASS, scoreLesson, type ExerciseOutcome, type LessonResult } from './progress';

/** Attempts allowed per phase: guided practice is forgiving, the checkpoint is one try. */
export const MAX_ATTEMPTS: Readonly<Record<ExercisePhase, number>> = {
  guided: 3,
  practice: 2,
  checkpoint: 1,
};
/** Each hint asked for before answering lowers the evidence of mastery a little. */
export const HINT_FACTOR = 0.8;

export type ExerciseState =
  | {
      readonly status: 'answering';
      readonly attempts: number;
      /** Hints visible now (unlocked by wrong attempts or asked for). */
      readonly hintsShown: number;
      readonly hintsAsked: number;
      readonly last: Evaluation | null;
    }
  | {
      readonly status: 'feedback';
      readonly attempts: number;
      readonly hintsShown: number;
      readonly hintsAsked: number;
      readonly evaluation: Evaluation;
      readonly revealed: boolean;
      /** True when the solution may be shown (correct, out of attempts, or revealed). */
      readonly final: boolean;
    };

export interface LessonSessionState {
  readonly lessonId: LessonId | null;
  readonly steps: readonly LessonStep[];
  readonly index: number;
  /** Null on explanation and playground steps. */
  readonly exercise: ExerciseState | null;
  readonly outcomes: readonly ExerciseOutcome[];
  readonly startedAt: number;
  readonly endedAt: number | null;
}

export type LessonEvent =
  | { readonly type: 'submit'; readonly answer: ExerciseAnswer }
  | { readonly type: 'hint' }
  | { readonly type: 'retry' }
  | { readonly type: 'reveal' }
  | { readonly type: 'continue'; readonly at: number };

export type LessonError =
  | { readonly code: 'FINISHED' }
  | { readonly code: 'INVALID_TRANSITION'; readonly event: LessonEvent['type'] }
  | { readonly code: 'INVALID_ANSWER'; readonly reason: AnswerError }
  | { readonly code: 'NO_MORE_HINTS' };

const fresh = (): ExerciseState => ({
  status: 'answering',
  attempts: 0,
  hintsShown: 0,
  hintsAsked: 0,
  last: null,
});

const exerciseAt = (steps: readonly LessonStep[], index: number) => {
  const step = steps[index];
  return step?.kind === 'exercise' ? step : null;
};

export function createLessonSessionState(
  lessonId: LessonId | null,
  steps: readonly LessonStep[],
  startedAt: number,
): LessonSessionState {
  if (steps.length === 0) throw new RangeError('A lesson needs at least one step');
  return {
    lessonId,
    steps,
    index: 0,
    exercise: exerciseAt(steps, 0) ? fresh() : null,
    outcomes: [],
    startedAt,
    endedAt: null,
  };
}

export const currentStep = (state: LessonSessionState): LessonStep =>
  state.steps[state.index] as LessonStep;
export const isFinished = (state: LessonSessionState) => state.endedAt !== null;

function outcomeOf(
  exercise: Exercise,
  phase: ExercisePhase,
  current: ExerciseState,
): ExerciseOutcome {
  const evaluation = current.status === 'feedback' ? current.evaluation : current.last;
  const credit = evaluation?.credit ?? 0;
  const revealed = current.status === 'feedback' && current.revealed;
  return {
    exerciseId: exercise.id,
    concept: exercise.concept,
    dimension: exercise.dimension,
    phase,
    attempts: current.attempts,
    credit,
    revealed,
    effective:
      Math.round(
        effectiveCredit({ credit, attempts: current.attempts, revealed }) *
          HINT_FACTOR ** current.hintsAsked *
          1000,
      ) / 1000,
  };
}

/** Pure state machine of a lesson (or review). Invalid events are errors, never ignored. */
export function lessonReducer(
  state: LessonSessionState,
  event: LessonEvent,
): Result<LessonSessionState, LessonError> {
  if (isFinished(state)) return err({ code: 'FINISHED' });
  const invalid = () => err({ code: 'INVALID_TRANSITION', event: event.type } as const);
  const step = exerciseAt(state.steps, state.index);
  const current = state.exercise;

  switch (event.type) {
    case 'submit': {
      if (!step || current?.status !== 'answering') return invalid();
      const evaluation = evaluateExercise(step.exercise, event.answer);
      if (!evaluation.ok) return err({ code: 'INVALID_ANSWER', reason: evaluation.error });
      const attempts = current.attempts + 1;
      const final = evaluation.value.verdict === 'correct' || attempts >= MAX_ATTEMPTS[step.phase];
      return ok({
        ...state,
        exercise: {
          status: 'feedback',
          attempts,
          hintsShown: current.hintsShown,
          hintsAsked: current.hintsAsked,
          evaluation: evaluation.value,
          revealed: false,
          final,
        },
      });
    }
    case 'hint': {
      if (!step || current?.status !== 'answering' || step.phase === 'checkpoint') return invalid();
      if (current.hintsShown >= step.exercise.hints.length) return err({ code: 'NO_MORE_HINTS' });
      return ok({
        ...state,
        exercise: {
          ...current,
          hintsShown: current.hintsShown + 1,
          hintsAsked: current.hintsAsked + 1,
        },
      });
    }
    case 'retry': {
      if (!step || current?.status !== 'feedback' || current.final) return invalid();
      return ok({
        ...state,
        exercise: {
          status: 'answering',
          attempts: current.attempts,
          // A wrong attempt unlocks the next hint for free.
          hintsShown: Math.min(
            step.exercise.hints.length,
            Math.max(current.hintsShown, current.attempts),
          ),
          hintsAsked: current.hintsAsked,
          last: current.evaluation,
        },
      });
    }
    case 'reveal': {
      if (!step || current?.status !== 'feedback' || current.evaluation.verdict === 'correct')
        return invalid();
      return ok({ ...state, exercise: { ...current, revealed: true, final: true } });
    }
    case 'continue': {
      // An exercise is left only after an answer; explanations and playgrounds can always continue.
      if (step && current?.status !== 'feedback') return invalid();
      const outcomes =
        step && current
          ? [...state.outcomes, outcomeOf(step.exercise, step.phase, current)]
          : state.outcomes;
      const index = state.index + 1;
      if (index >= state.steps.length)
        return ok({ ...state, outcomes, exercise: null, endedAt: event.at });
      return ok({
        ...state,
        index,
        outcomes,
        exercise: exerciseAt(state.steps, index) ? fresh() : null,
      });
    }
  }
}

export function lessonResultOf(state: LessonSessionState): LessonResult | null {
  if (state.endedAt === null || state.lessonId === null) return null;
  const score = scoreLesson(state.outcomes);
  return {
    lessonId: state.lessonId,
    outcomes: state.outcomes,
    score,
    passed: score >= LESSON_PASS,
    startedAt: state.startedAt,
    endedAt: state.endedAt,
  };
}
