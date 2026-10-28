import { useStepper } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import type { SequenceRecallChallenge } from '../content/types';
import { SymbolFace } from './SymbolFace';

const spoken = (id: string) => id.split(':')[1] ?? id;

/** Plays the sequence one item at a time during the study phase; afterwards shows the pad hint. */
export function SequenceRecallView({
  challenge,
  phase,
  assisted,
}: ContentViewProps<SequenceRecallChallenge>) {
  const { items, itemMs, kind } = challenge.content;
  const step = useStepper(
    items.length,
    assisted ? itemMs * 1.5 : itemMs,
    phase === 'study',
    challenge.id,
  );
  if (phase === 'study') {
    const current = items[step];
    return (
      <div className="flex flex-col items-center gap-4">
        <div
          aria-live="assertive"
          aria-atomic="true"
          className="flex h-36 w-36 items-center justify-center rounded-2xl border border-line bg-raised"
        >
          {current === undefined ? (
            <span className="text-sm text-ink-muted">Done — get ready</span>
          ) : (
            <span
              key={`${step}`}
              className="animate-pop"
              aria-label={`${step + 1}: ${spoken(current)}`}
            >
              <SymbolFace id={current} className="h-24 w-24" />
            </span>
          )}
        </div>
        <ol aria-hidden="true" className="flex gap-1.5">
          {items.map((id, i) => (
            <li
              key={`${id}-${i}`}
              className={`h-2 w-6 rounded-full ${i <= step ? 'bg-brand' : 'bg-line'}`}
            />
          ))}
        </ol>
      </div>
    );
  }
  if (phase === 'review') {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-ink-muted">You saw:</p>
        <ol className="flex flex-wrap justify-center gap-2" aria-label="The sequence shown">
          {items.map((id, i) => (
            <li
              key={`${id}-${i}`}
              aria-label={`${i + 1}: ${spoken(id)}`}
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-raised"
            >
              <SymbolFace id={id} />
            </li>
          ))}
        </ol>
      </div>
    );
  }
  return (
    <p className="text-center text-ink-soft">
      {kind === 'forward' ? 'Same order as shown.' : 'Reverse order: begin with the last symbol.'}{' '}
      {items.length} symbols.
    </p>
  );
}
