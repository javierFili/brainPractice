import { useEffect, useRef } from 'react';
import type { Challenge } from '@/domain/challenge';
import type { ChallengeRecord } from '@/domain/session';
import { Button } from '@/components/ui/Button';
import { describeSolution } from './describe';

/** How long the mark stays before moving on: long enough to read, short enough to keep pace. */
export const BRIEF_CORRECT_MS = 650;
export const BRIEF_OTHER_MS = 1600;

const MARKS = {
  correct: { icon: '✓', text: 'Correct', tone: 'border-success/60 bg-success/10 text-success' },
  incorrect: {
    icon: '✗',
    text: 'Not this time',
    tone: 'border-danger/60 bg-danger/10 text-danger',
  },
  'timed-out': {
    icon: '⧗',
    text: "Time's up",
    tone: 'border-warning/60 bg-warning/10 text-warning',
  },
  skipped: { icon: '–', text: 'Skipped', tone: 'border-line bg-raised text-ink-soft' },
} as const;

/**
 * Feedback for fast-paced games: a short mark that advances by itself. In relaxed mode it waits
 * for the player instead, so nobody is rushed.
 */
export function BriefFeedback({
  challenge,
  record,
  isLast,
  autoAdvance,
  onNext,
}: {
  challenge: Challenge;
  record: ChallengeRecord;
  isLast: boolean;
  autoAdvance: boolean;
  onNext: () => void;
}) {
  const nextRef = useRef<HTMLButtonElement>(null);
  const mark = MARKS[record.outcome];

  useEffect(() => {
    nextRef.current?.focus();
    if (!autoAdvance || isLast) return undefined;
    const timer = setTimeout(
      onNext,
      record.outcome === 'correct' ? BRIEF_CORRECT_MS : BRIEF_OTHER_MS,
    );
    return () => {
      clearTimeout(timer);
    };
  }, [record, autoAdvance, isLast, onNext]);

  return (
    <div
      className={`flex animate-fade-in flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${mark.tone}`}
    >
      <p role="status" aria-live="polite" className="font-semibold">
        <span aria-hidden="true">{mark.icon} </span>
        {mark.text}
        {record.outcome !== 'correct' && (
          <span className="ml-2 font-normal text-ink-soft">
            Answer: {describeSolution(challenge)}
          </span>
        )}
      </p>
      <Button ref={nextRef} variant="secondary" onClick={onNext}>
        {isLast ? 'See results' : 'Continue'} <span aria-hidden="true">→</span>
      </Button>
    </div>
  );
}
