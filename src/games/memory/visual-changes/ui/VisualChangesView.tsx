import { glyphLabel, type Glyph as GlyphSpec } from '@/games/kit/content';
import { CellGrid, Glyph, MultiSelectBoard, type CellState } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName } from '../../shared/content';
import type { VisualChangesChallenge } from '../content/types';

const cellOf = (glyph: GlyphSpec | null, index: number, size: number) => ({
  key: String(index),
  label: `${cellName(index, size)}, ${glyph === null ? 'empty' : glyphLabel(glyph)}`,
  content: glyph === null ? null : <Glyph glyph={glyph} decorative className="h-3/5 w-3/5" />,
});

export function VisualChangesView({
  challenge,
  phase,
  locate,
  respond,
  answer,
}: ContentViewProps<VisualChangesChallenge>) {
  const { size, before, after, changed } = challenge.content;
  const { response } = challenge;
  const gridSize = size >= 6 ? 'sm' : 'md';

  if (phase === 'study') {
    return (
      <CellGrid
        label="Shapes to remember"
        columns={size}
        size={gridSize}
        cells={before.map((g, i) => cellOf(g, i, size))}
      />
    );
  }
  if (response.format === 'multi-select') {
    return (
      <MultiSelectBoard
        response={response}
        label="Mark the two shapes that swapped"
        columns={size}
        size={gridSize}
        respond={respond}
        answer={answer}
        cells={after.map((g, i) => cellOf(g, i, size))}
      />
    );
  }
  const picked = answer?.format === 'locate' ? answer.index : (locate?.selectedIndex ?? null);
  const stateOf = (index: number): CellState => {
    if (phase !== 'review') return 'idle';
    if (changed.includes(index)) return picked === index ? 'hit' : 'missed';
    return picked === index ? 'wrong' : 'idle';
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <CellGrid
        label="Which shape changed?"
        columns={size}
        size={gridSize}
        cells={after.map((g, i) => ({ ...cellOf(g, i, size), state: stateOf(i) }))}
        {...(phase === 'respond' && locate !== null
          ? {
              onPress: (index: number) => {
                locate.onLocate(index);
              },
            }
          : {})}
        disabled={locate?.disabled ?? true}
      />
      {phase === 'review' && changed[0] !== undefined && before[changed[0]] && (
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          It was
          <Glyph glyph={before[changed[0]] as GlyphSpec} className="h-6 w-6" />
          {glyphLabel(before[changed[0]] as GlyphSpec)} before.
        </p>
      )}
    </div>
  );
}
