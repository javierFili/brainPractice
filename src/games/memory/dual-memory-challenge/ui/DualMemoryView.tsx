import { useTranslation } from 'react-i18next';
import { msg } from '@/domain/shared';
import { useText } from '@/i18n';
import { CellGrid, ObjectFace, useStepper, type CellState } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName, objectById } from '../../shared/content';
import { HiddenNote } from '../../shared/ui/HiddenNote';
import type { DualMemoryChallenge } from '../content/types';

export function DualMemoryView({
  challenge,
  phase,
  locate,
  answer,
  assisted,
}: ContentViewProps<DualMemoryChallenge>) {
  const { t } = useTranslation('memory');
  const tx = useText();
  const { size, placements, ask, itemMs, kind } = challenge.content;
  const count = size * size;
  const gridSize = size >= 5 ? 'sm' : 'md';
  // Lit half a step, dark half a step, so consecutive objects are seen as separate events.
  const half = useStepper(
    placements.length * 2,
    (assisted ? itemMs * 1.5 : itemMs) / 2,
    phase === 'study',
    challenge.id,
  );
  const target = placements[ask];
  const byCell = new Map(placements.map((p, i) => [p.cell, { ...p, turn: i + 1 }]));

  if (phase === 'study') {
    const current = half % 2 === 0 ? placements[half / 2] : undefined;
    return (
      <div className="flex flex-col items-center gap-3">
        <CellGrid
          label={msg('memory:dualMemoryChallenge.view.grid')}
          columns={size}
          size={gridSize}
          cells={Array.from({ length: count }, (_, i) => {
            const here = current?.cell === i ? current : undefined;
            const item = here ? objectById(here.objectId) : undefined;
            return {
              key: String(i),
              label: item
                ? msg('memory:dualMemoryChallenge.view.cellWith', {
                    cell: cellName(i, size),
                    name: item.label,
                  })
                : cellName(i, size),
              content: item ? <ObjectFace item={item} className="text-2xl sm:text-3xl" /> : null,
            };
          })}
        />
        <p aria-live="assertive" aria-atomic="true" className="text-sm text-ink-muted">
          {half >= placements.length * 2
            ? t('dualMemoryChallenge.view.done')
            : current
              ? t('dualMemoryChallenge.view.appeared', {
                  turn: half / 2 + 1,
                  name: tx(objectById(current.objectId).label),
                  cell: tx(cellName(current.cell, size)),
                })
              : ''}
        </p>
      </div>
    );
  }

  if (phase === 'respond') {
    if (kind === 'which-nth')
      return <HiddenNote>{t('dualMemoryChallenge.view.hidden')}</HiddenNote>;
    const marked = kind === 'which-here' ? target?.cell : undefined;
    return (
      <CellGrid
        label={msg(
          kind === 'which-here'
            ? 'memory:dualMemoryChallenge.view.gridMarked'
            : 'memory:dualMemoryChallenge.view.pointSquare',
        )}
        columns={size}
        size={gridSize}
        cells={Array.from({ length: count }, (_, i) => ({
          key: String(i),
          label:
            i === marked
              ? msg('memory:dualMemoryChallenge.view.cellMarked', { cell: cellName(i, size) })
              : cellName(i, size),
          state: i === marked ? 'highlight' : 'idle',
          content:
            i === marked ? (
              <span aria-hidden="true" className="text-xl font-bold text-glow">
                ?
              </span>
            ) : null,
        }))}
        {...(locate !== null && kind !== 'which-here'
          ? {
              onPress: (i: number) => {
                locate.onLocate(i);
              },
            }
          : {})}
        disabled={locate?.disabled ?? true}
      />
    );
  }

  // Review: everything, with turn numbers, and the asked placement highlighted.
  const picked = answer?.format === 'locate' ? answer.index : null;
  const stateOf = (i: number): CellState => {
    if (i === target?.cell) return picked === null || picked === i ? 'highlight' : 'missed';
    return picked === i ? 'wrong' : 'idle';
  };
  return (
    <CellGrid
      label={msg('memory:dualMemoryChallenge.view.whatShown')}
      columns={size}
      size={gridSize}
      cells={Array.from({ length: count }, (_, i) => {
        const here = byCell.get(i);
        const item = here ? objectById(here.objectId) : undefined;
        return {
          key: String(i),
          label:
            here && item
              ? msg('memory:dualMemoryChallenge.view.cellShown', {
                  cell: cellName(i, size),
                  name: item.label,
                  turn: here.turn,
                })
              : cellName(i, size),
          state: stateOf(i),
          content:
            here && item ? (
              <span className="flex flex-col items-center">
                <ObjectFace item={item} className="text-xl sm:text-2xl" />
                <span aria-hidden="true" className="text-xs text-ink-muted">
                  {here.turn}
                </span>
              </span>
            ) : null,
        };
      })}
    />
  );
}
