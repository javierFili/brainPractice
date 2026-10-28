import type { ContentViewProps } from '@/games/types';
import type { NumberComparisonChallenge } from '../content/types';

/** The options themselves are the numbers; the view states the rule in large type. */
export function NumberComparisonView({
  challenge,
  phase,
}: ContentViewProps<NumberComparisonChallenge>) {
  const { ask, items, kind } = challenge.content;
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-2xl font-semibold tracking-wide text-glow uppercase">{ask}</p>
      <p className="text-sm text-ink-muted">
        {items.length} values · pick the {ask}
      </p>
      {phase === 'review' && kind === 'expressions' && (
        <ul
          aria-label="Values"
          className="flex flex-wrap justify-center gap-3 text-sm text-ink-soft"
        >
          {items.map((q) => (
            <li key={q.label}>
              {q.label} = <span className="font-semibold text-ink">{q.num / q.den}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
