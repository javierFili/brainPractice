import type { ContentViewProps } from '@/games/types';
import { spokenExpression } from '../content/expressions';
import type { ArithmeticChallenge } from '../content/types';

/** The equation in large type; the result slot shows "?" until the review reveals it. */
export function ArithmeticView({ challenge, phase }: ContentViewProps<ArithmeticChallenge>) {
  const { expression, value, shown, kind } = challenge.content;
  const right = kind === 'verify' ? String(shown) : phase === 'review' ? String(value) : '?';
  const spoken = `${spokenExpression(expression)} equals ${right === '?' ? 'what' : right}`;
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-center font-mono text-3xl font-semibold text-ink tabular-nums sm:text-4xl">
        <span className="sr-only">{spoken}</span>
        <span aria-hidden="true">
          {expression} = <span className={right === '?' ? 'text-glow' : ''}>{right}</span>
        </span>
      </p>
      {phase === 'review' && kind === 'verify' && shown !== value && (
        <p className="text-sm text-ink-soft">
          {expression} = <span className="font-semibold text-ink">{value}</span>
        </p>
      )}
    </div>
  );
}
