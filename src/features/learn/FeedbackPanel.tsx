import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExerciseState } from '@/domain/learning';
import { textId, type Text } from '@/domain/shared';
import { useText } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { InlineText } from './RichBlocks';

type Feedback = Extract<ExerciseState, { status: 'feedback' }>;

const TONE = {
  correct: { icon: '✓', box: 'border-emerald-400/50 bg-emerald-400/5', title: 'text-emerald-200' },
  partial: { icon: '◐', box: 'border-amber-400/50 bg-amber-400/5', title: 'text-amber-200' },
  incorrect: { icon: '✗', box: 'border-rose-400/50 bg-rose-400/5', title: 'text-rose-200' },
} as const;

/**
 * Teaching feedback: always what was wrong about *your* answer; the explanation and the right
 * answer only once the exercise is final (correct, out of attempts, or solution revealed).
 */
export function FeedbackPanel({
  state,
  attemptsLeft,
  nextHint,
  onRetry,
  onReveal,
  onContinue,
  continueLabel,
}: {
  state: Feedback;
  attemptsLeft: number;
  nextHint: Text | null;
  onRetry: () => void;
  onReveal: () => void;
  onContinue: () => void;
  continueLabel: string;
}) {
  const { t } = useTranslation(['learn', 'lessons']);
  const tx = useText();
  const { evaluation, final, revealed } = state;
  const { feedback, verdict } = evaluation;
  const tone = TONE[verdict];
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    primary.current?.focus();
  }, [state]);

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${tone.box}`}>
      <div role="status" aria-live="polite">
        <p className={`text-lg font-semibold ${tone.title}`}>
          <span aria-hidden="true">{tone.icon} </span>
          {revealed ? t('feedbackPanel.solution') : tx(feedback.headline)}
        </p>
        <p className="mt-1 text-sm text-slate-300">
          <InlineText text={feedback.yourAnswer} />
        </p>
        {feedback.diagnosis.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-slate-100">
            {feedback.diagnosis.map((line) => (
              <li key={textId(line)}>
                <InlineText text={line} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {final ? (
        <div className="mt-3 border-t border-slate-700/60 pt-3 text-sm">
          {verdict !== 'correct' && (
            <p className="text-slate-200">
              {t('feedbackPanel.correctAnswer')}{' '}
              <span className="font-semibold text-emerald-300">
                <InlineText text={feedback.correctAnswer} />
              </span>
            </p>
          )}
          <p className="mt-1 leading-relaxed text-slate-300">
            <InlineText text={feedback.explanation} />
          </p>
        </div>
      ) : (
        nextHint !== null && (
          <p className="mt-3 text-sm text-sky-200">
            <span className="font-semibold">{t('feedbackPanel.hint')}</span>{' '}
            <InlineText text={nextHint} />
          </p>
        )
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {!final && (
          <Button ref={primary} onClick={onRetry}>
            {attemptsLeft > 0
              ? t('feedbackPanel.tryAgainLeft', { count: attemptsLeft })
              : t('feedbackPanel.tryAgain')}
          </Button>
        )}
        {!final && (
          <Button variant="secondary" onClick={onReveal}>
            {t('feedbackPanel.showSolution')}
          </Button>
        )}
        <Button
          ref={final ? primary : undefined}
          variant={final ? 'primary' : 'ghost'}
          onClick={onContinue}
        >
          {final ? continueLabel : t('feedbackPanel.skip')} <span aria-hidden="true">→</span>
        </Button>
      </div>
    </div>
  );
}
