import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import {
  currentStep,
  MAX_ATTEMPTS,
  type LessonId,
  type LessonSessionState,
  type LessonStep,
} from '@/domain/learning';
import { textId, type Text } from '@/domain/shared';
import { useText } from '@/i18n';
import { createLessonSession, type LessonSession } from '@/engine';
import { useServices } from '@/app/providers/servicesContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ExerciseView } from './exercises/ExerciseView';
import { FeedbackPanel } from './FeedbackPanel';
import { PlaygroundView } from './PlaygroundView';
import { InlineText, RichBlocks } from './RichBlocks';

function ExerciseStepView({
  step,
  state,
  session,
  isLast,
}: {
  step: Extract<LessonStep, { kind: 'exercise' }>;
  state: LessonSessionState;
  session: LessonSession;
  isLast: boolean;
}) {
  const { t } = useTranslation(['learn', 'lessons']);
  const exercise = state.exercise;
  if (exercise === null) return null;
  const { hints } = step.exercise;
  const answering = exercise.status === 'answering';
  const showSolution = exercise.status === 'feedback' && exercise.final;
  const canHint = answering && step.phase !== 'checkpoint' && exercise.hintsShown < hints.length;
  const nextHint =
    exercise.status === 'feedback' && !exercise.final
      ? (hints[Math.min(exercise.attempts, hints.length) - 1] ?? null)
      : null;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-slate-400">
        <Badge className="mr-2">{t(`player.phase.${step.phase}.label`)}</Badge>
        {t(`player.phase.${step.phase}.note`)}
      </p>
      <ExerciseView
        // Same key across retries: the learner edits their previous attempt.
        key={step.id}
        exercise={step.exercise}
        locked={!answering}
        showSolution={showSolution}
        onSubmit={(answer) => {
          const result = session.submit(answer);
          if (!result.ok) console.error('[learn] Rejected answer', result.error);
        }}
      />
      {answering && exercise.hintsShown > 0 && (
        <ul className="flex flex-col gap-1 rounded-lg border border-sky-400/30 bg-sky-400/5 p-3 text-sm text-sky-100">
          {hints.slice(0, exercise.hintsShown).map((hint, i) => (
            <li key={textId(hint)}>
              <span className="font-semibold">{t('player.hintNumber', { number: i + 1 })}</span>{' '}
              <InlineText text={hint} />
            </li>
          ))}
        </ul>
      )}
      {canHint && (
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              session.hint();
            }}
          >
            {t('player.showHint')}
          </Button>
        </div>
      )}
      {exercise.status === 'feedback' && (
        <FeedbackPanel
          state={exercise}
          attemptsLeft={MAX_ATTEMPTS[step.phase] - exercise.attempts}
          nextHint={nextHint}
          continueLabel={isLast ? t('player.finish') : t('player.continue')}
          onRetry={() => {
            session.retry();
          }}
          onReveal={() => {
            session.reveal();
          }}
          onContinue={() => {
            session.next();
          }}
        />
      )}
    </div>
  );
}

/**
 * Plays a lesson or a review: one step at a time, through the pure lesson state machine.
 * Calls `onFinished` once with the final state.
 */
export function LessonPlayer({
  title,
  lessonId,
  steps,
  onFinished,
}: {
  title: Text;
  lessonId: LessonId | null;
  steps: readonly LessonStep[];
  onFinished: (state: LessonSessionState, session: LessonSession) => void;
}) {
  const { t } = useTranslation(['learn', 'lessons']);
  const tx = useText();
  const { clock } = useServices();
  const [session] = useState(() => createLessonSession(lessonId, steps, clock));
  const state = useSyncExternalStore(session.subscribe, session.getState);
  const heading = useRef<HTMLHeadingElement>(null);
  const reported = useRef(false);
  const finished = state.endedAt !== null;

  useEffect(() => {
    if (state.index > 0) heading.current?.focus();
  }, [state.index]);

  useEffect(() => {
    if (!finished || reported.current) return;
    reported.current = true;
    onFinished(state, session);
  }, [finished, state, session, onFinished]);

  if (finished) return null;
  const step = currentStep(state);
  const isLast = state.index === state.steps.length - 1;
  const stepTitle = step.kind === 'exercise' ? step.exercise.prompt : step.title;

  return (
    <article aria-labelledby="step-title" className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="font-medium text-white">{tx(title)}</p>
          <p className="font-mono text-slate-400">
            {t('player.step', { number: state.index + 1, total: state.steps.length })}
          </p>
        </div>
        <ProgressBar
          value={state.index}
          max={state.steps.length}
          label={t('player.progress')}
          tone="bg-violet-400"
        />
      </header>
      <h2
        id="step-title"
        ref={heading}
        tabIndex={-1}
        className="text-xl font-semibold text-white outline-none sm:text-2xl"
      >
        <InlineText text={stepTitle} />
      </h2>
      {step.kind === 'explain' && <RichBlocks blocks={step.blocks} />}
      {step.kind === 'playground' && (
        <PlaygroundView key={step.id} playground={step.playground} intro={step.intro} />
      )}
      {step.kind === 'exercise' && (
        <ExerciseStepView step={step} state={state} session={session} isLast={isLast} />
      )}
      {step.kind !== 'exercise' && (
        <div>
          <Button
            onClick={() => {
              session.next();
            }}
          >
            {isLast ? t('player.finish') : t('player.continue')} <span aria-hidden="true">→</span>
          </Button>
        </div>
      )}
    </article>
  );
}
