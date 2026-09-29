import { useEffect, useRef } from 'react';
import type { Challenge } from '@/domain/challenge';
import type { ChallengeRecord } from '@/domain/session';
import { Button } from '@/components/ui/Button';
import { formatMs, formatPoints } from '@/features/shared/format';
import { describeAnswer, describeSolution } from './describe';

const TITLES = {
  correct: {
    icon: '✓',
    text: 'Correct',
    tone: 'border-emerald-400/50 bg-emerald-400/5 text-emerald-200',
  },
  incorrect: {
    icon: '✗',
    text: 'Incorrect',
    tone: 'border-rose-400/50 bg-rose-400/5 text-rose-200',
  },
  'timed-out': {
    icon: '⧗',
    text: "Time's up",
    tone: 'border-amber-400/50 bg-amber-400/5 text-amber-200',
  },
  skipped: { icon: '–', text: 'Skipped', tone: 'border-slate-600 bg-slate-800 text-slate-200' },
} as const;

export function AnswerFeedback({
  challenge,
  record,
  isLast,
  onNext,
}: {
  challenge: Challenge;
  record: ChallengeRecord;
  isLast: boolean;
  onNext: () => void;
}) {
  const nextRef = useRef<HTMLButtonElement>(null);
  const title = TITLES[record.outcome];

  useEffect(() => {
    nextRef.current?.focus();
  }, [record]);

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${title.tone}`}>
      <div
        role="status"
        aria-live="polite"
        className="flex flex-wrap items-baseline justify-between gap-2"
      >
        <p className="text-lg font-semibold">
          <span aria-hidden="true">{title.icon} </span>
          {title.text}
        </p>
        <p className="font-mono text-sm tabular-nums">
          {record.points.total >= 0 ? '+' : ''}
          {formatPoints(record.points.total)} pts
          {record.responseTimeMs !== null && (
            <span className="text-slate-400"> · {formatMs(record.responseTimeMs)}</span>
          )}
        </p>
      </div>
      {record.outcome !== 'correct' && (
        <p className="mt-2 text-sm text-slate-200">
          Your answer: <span className="font-mono">{describeAnswer(challenge, record.answer)}</span>{' '}
          · Correct: <span className="font-mono font-semibold">{describeSolution(challenge)}</span>
        </p>
      )}
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{challenge.explanation}</p>
      <div className="mt-4">
        <Button ref={nextRef} onClick={onNext}>
          {isLast ? 'See results' : 'Next challenge'} <span aria-hidden="true">→</span>
        </Button>
      </div>
    </div>
  );
}
