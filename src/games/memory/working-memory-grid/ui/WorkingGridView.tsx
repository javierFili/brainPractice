import { useTranslation } from 'react-i18next';
import { joinText, msg } from '@/domain/shared';
import { useText } from '@/i18n';
import { CellGrid, MultiSelectBoard, useStepper, type CellState } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName } from '../../shared/content';
import type { WorkingGridChallenge } from '../content/types';

function Light() {
  return (
    <span
      aria-hidden="true"
      className="flex h-4/5 w-4/5 items-center justify-center rounded-md bg-glyph-blue"
    >
      <span className="h-2.5 w-2.5 rounded-full bg-canvas" />
    </span>
  );
}

export function WorkingGridView({
  challenge,
  phase,
  locate,
  respond,
  answer,
  assisted,
}: ContentViewProps<WorkingGridChallenge>) {
  const { t } = useTranslation('memory');
  const tx = useText();
  const { size, stream, itemMs } = challenge.content;
  const { response } = challenge;
  const count = size * size;
  const gridSize = size >= 5 ? 'sm' : 'md';
  // Two half-steps per light: lit, then dark, so a cell lit twice is seen twice.
  const half = useStepper(
    stream.length * 2,
    (assisted ? itemMs * 1.5 : itemMs) / 2,
    phase === 'study',
    challenge.id,
  );

  if (phase === 'study') {
    const lit = half % 2 === 0 ? (stream[half / 2] ?? null) : null;
    return (
      <div className="flex flex-col items-center gap-3">
        <CellGrid
          label={msg('memory:workingMemoryGrid.view.lights')}
          columns={size}
          size={gridSize}
          cells={Array.from({ length: count }, (_, i) => ({
            key: String(i),
            label:
              i === lit
                ? msg('memory:workingMemoryGrid.view.cellLit', { cell: cellName(i, size) })
                : cellName(i, size),
            content: i === lit ? <Light /> : null,
          }))}
        />
        <p aria-live="assertive" aria-atomic="true" className="text-sm text-ink-muted">
          {half >= stream.length * 2
            ? t('workingMemoryGrid.view.done')
            : lit !== null
              ? t('workingMemoryGrid.view.lightAt', { cell: tx(cellName(lit, size)) })
              : ''}
        </p>
      </div>
    );
  }

  if (response.format === 'multi-select') {
    return (
      <MultiSelectBoard
        response={response}
        label={msg('memory:workingMemoryGrid.view.markLast')}
        columns={size}
        size={gridSize}
        respond={respond}
        answer={answer}
        cells={Array.from({ length: count }, (_, i) => ({
          key: String(i),
          label: cellName(i, size),
        }))}
      />
    );
  }
  if (response.format !== 'locate')
    throw new Error('Working Memory Grid uses multi-select or locate');
  const solution = response.solution.index;
  const picked = answer?.format === 'locate' ? answer.index : null;
  const stateOf = (i: number): CellState => {
    if (phase !== 'review') return 'idle';
    if (i === solution) return picked === i ? 'hit' : 'missed';
    return picked === i ? 'wrong' : 'idle';
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <CellGrid
        label={msg('memory:workingMemoryGrid.view.pointLight')}
        columns={size}
        size={gridSize}
        cells={Array.from({ length: count }, (_, i) => ({
          key: String(i),
          label: cellName(i, size),
          state: stateOf(i),
        }))}
        {...(phase === 'respond' && locate !== null
          ? {
              onPress: (i: number) => {
                locate.onLocate(i);
              },
            }
          : {})}
        disabled={locate?.disabled ?? true}
      />
      {phase === 'review' && (
        <p className="text-center text-sm text-ink-soft">
          {t('workingMemoryGrid.view.orderShown', {
            order: tx(
              joinText(
                stream.map((i) => cellName(i, size)),
                ' → ',
              ),
            ),
          })}
        </p>
      )}
    </div>
  );
}
