import { CellGrid, MultiSelectBoard } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName } from '../content/definition';
import type { PositionMemoryChallenge } from '../content/types';

/** Targets are blue with a dot, distractors orange with stripes: never colour alone. */
function Lit({ tone }: { tone: 'target' | 'distractor' }) {
  return tone === 'target' ? (
    <span
      aria-hidden="true"
      className="flex h-4/5 w-4/5 items-center justify-center rounded-md bg-glyph-blue"
    >
      <span className="h-2.5 w-2.5 rounded-full bg-canvas" />
    </span>
  ) : (
    <span
      aria-hidden="true"
      className="h-4/5 w-4/5 rounded-md bg-glyph-orange"
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, transparent 0 6px, rgb(0 0 0 / 0.35) 6px 10px)',
      }}
    />
  );
}

export function PositionMemoryView({
  challenge,
  phase,
  respond,
  answer,
}: ContentViewProps<PositionMemoryChallenge>) {
  const { size, targets, distractors } = challenge.content;
  const { response } = challenge;
  if (response.format !== 'multi-select') throw new Error('Position Memory uses multi-select');
  const count = size * size;
  const gridSize = size >= 6 ? 'sm' : 'md';
  if (phase === 'study') {
    return (
      <CellGrid
        label="Grid to remember"
        columns={size}
        size={gridSize}
        cells={Array.from({ length: count }, (_, i) => {
          const tone = targets.includes(i)
            ? 'target'
            : distractors.includes(i)
              ? 'distractor'
              : null;
          return {
            key: String(i),
            label: `${cellName(i, size)}${tone === 'target' ? ', lit blue' : tone === 'distractor' ? ', lit orange' : ''}`,
            content: tone === null ? null : <Lit tone={tone} />,
          };
        })}
      />
    );
  }
  return (
    <MultiSelectBoard
      response={response}
      label="Mark the cells"
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
