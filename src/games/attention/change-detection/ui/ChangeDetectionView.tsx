import { CellGrid, useStepper } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName, markLabel, type Mark } from '../../shared/content';
import { MarkFace } from '../../shared/ui';
import { changedCells } from '../content/definition';
import type { ChangeDetectionChallenge } from '../content/types';

type Cell = Mark | null;

function Scene({
  cells,
  columns,
  label,
  changed = [],
}: {
  readonly cells: readonly Cell[] | null;
  readonly columns: number;
  readonly label: string;
  readonly changed?: readonly number[];
}) {
  const count = cells?.length ?? 0;
  return (
    <CellGrid
      label={label}
      columns={columns}
      size={columns >= 5 ? 'sm' : 'md'}
      cells={Array.from({ length: count }, (_, i) => {
        const cell = cells?.[i] ?? null;
        const isChanged = changed.includes(i);
        return {
          key: String(i),
          label: `${cellName(i, columns)}, ${cell === null ? 'empty' : markLabel(cell)}${isChanged ? ', changed' : ''}`,
          content: cell === null ? null : <MarkFace mark={cell} />,
          state: isChanged ? 'highlight' : 'idle',
        };
      })}
    />
  );
}

/** First look in the study phase; then a blank board for `gapMs`, then the second look. */
export function ChangeDetectionView({
  challenge,
  phase,
}: ContentViewProps<ChangeDetectionChallenge>) {
  const { before, after, columns, gapMs } = challenge.content;
  const step = useStepper(1, gapMs, phase === 'respond', challenge.id);
  if (phase === 'study') return <Scene cells={before} columns={columns} label="First look" />;
  if (phase === 'review') {
    const changed = changedCells(before, after);
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-label="First look">
          <p className="mb-2 text-center text-xs font-semibold text-ink-muted uppercase">
            First look
          </p>
          <Scene cells={before} columns={columns} label="First look" changed={changed} />
        </section>
        <section aria-label="Second look">
          <p className="mb-2 text-center text-xs font-semibold text-ink-muted uppercase">
            Second look {changed.length === 0 ? '(no change)' : ''}
          </p>
          <Scene cells={after} columns={columns} label="Second look" changed={changed} />
        </section>
      </div>
    );
  }
  const blank = step === 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <p aria-live="polite" className="text-sm text-ink-muted">
        {blank ? 'Wait…' : 'Second look'}
      </p>
      {blank ? (
        <Scene cells={before.map(() => null)} columns={columns} label="Blank board" />
      ) : (
        <Scene cells={after} columns={columns} label="Second look" />
      )}
    </div>
  );
}
