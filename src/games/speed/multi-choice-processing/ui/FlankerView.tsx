import type { ContentViewProps } from '@/games/types';
import type { Direction, FlankerChallenge, RowItem } from '../content/types';

const ROTATION: Record<Direction, number> = { right: 0, down: 90, left: 180, up: 270 };

/** A solid arrow pointing right, rotated to its direction; neutral items are a plain bar. */
export function Arrow({ item, className }: { readonly item: RowItem; readonly className: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      {item === 'none' ? (
        <rect x="14" y="40" width="72" height="20" rx="4" className="fill-ink-muted" />
      ) : (
        <path
          d="M10 38h46V16l36 34-36 34V62H10Z"
          transform={`rotate(${ROTATION[item]} 50 50)`}
          className="fill-ink"
        />
      )}
    </svg>
  );
}

const spoken = (item: RowItem) => (item === 'none' ? 'bar' : item);

/** The cue (cued levels) and the row of arrows. No motion: the row appears once and stays. */
export function FlankerView({ challenge }: ContentViewProps<FlankerChallenge>) {
  const { kind, rule, row, track, start } = challenge.content;
  return (
    <div className="flex flex-col items-center gap-4">
      {kind === 'cued' &&
        (rule === 'centre' ? (
          <p className="flex items-center gap-2 rounded-full border border-brand/60 bg-brand/10 px-4 py-1 text-base font-bold tracking-widest text-brand-strong">
            <span aria-hidden="true">◎</span> CENTRE
          </p>
        ) : (
          <p className="flex items-center gap-2 rounded-full border border-glow/60 bg-glow/10 px-4 py-1 text-base font-bold tracking-widest text-glow">
            <span aria-hidden="true">◌</span> OUTER
          </p>
        ))}
      <div className="flex w-full justify-center rounded-2xl border border-line bg-raised px-2 py-6">
        <p className="sr-only">
          {row.length === 1
            ? `One arrow pointing ${spoken(row[0] ?? 'none')}.`
            : `Row of ${row.length}: ${row.map(spoken).join(', ')}.`}
        </p>
        <div className="flex items-center gap-1 sm:gap-2">
          {Array.from({ length: track }, (_, slot) => {
            const item = row[slot - start];
            return item === undefined ? (
              <span key={slot} aria-hidden="true" className="h-10 w-10 sm:h-14 sm:w-14" />
            ) : (
              <Arrow key={slot} item={item} className="h-10 w-10 sm:h-14 sm:w-14" />
            );
          })}
        </div>
      </div>
    </div>
  );
}
