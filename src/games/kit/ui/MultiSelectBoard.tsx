import { useState } from 'react';
import type { Answer, ResponseOf } from '@/domain/challenge';
import { Button } from '@/components/ui/Button';
import { CellGrid, type CellState, type GridCell } from './CellGrid';

interface Props {
  readonly response: ResponseOf<'multi-select'>;
  /** One entry per element, in index order; `state` is ignored (the board owns it). */
  readonly cells: readonly Omit<GridCell, 'state'>[];
  readonly columns: number;
  readonly label: string;
  readonly respond: ((answer: Answer) => void) | null;
  /** The recorded answer, to show the review. */
  readonly answer: Answer | null;
  readonly size?: 'sm' | 'md' | 'lg';
  /** Verb on the submit button, e.g. "Check positions". */
  readonly submitLabel?: string;
}

/**
 * Mark-then-confirm selection on a grid, for the `multi-select` format. Nothing is submitted until
 * the player confirms, so a stray tap is always recoverable. The review shows hits (✓), missed
 * targets (•) and wrong marks (✗).
 */
export function MultiSelectBoard({
  response,
  cells,
  columns,
  label,
  respond,
  answer,
  size,
  submitLabel = 'Check',
}: Props) {
  const [marks, setMarks] = useState<readonly number[]>([]);
  const { exactCount } = response.question;
  const review = answer?.format === 'multi-select' ? answer.indices : null;
  const targets = new Set(response.solution.indices);

  const stateOf = (index: number): CellState => {
    if (review !== null) {
      const marked = review.includes(index);
      if (targets.has(index)) return marked ? 'hit' : 'missed';
      return marked ? 'wrong' : 'dim';
    }
    return marks.includes(index) ? 'marked' : 'idle';
  };

  const toggle = (index: number) => {
    setMarks((current) => {
      if (current.includes(index)) return current.filter((i) => i !== index);
      if (exactCount !== null && current.length >= exactCount) return current;
      return [...current, index];
    });
  };

  const ready = exactCount === null || marks.length === exactCount;
  return (
    <div className="flex flex-col items-center gap-4">
      <CellGrid
        cells={cells.map((cell, i) => ({ ...cell, state: stateOf(i) }))}
        columns={columns}
        label={label}
        {...(respond !== null ? { onPress: toggle } : {})}
        disabled={respond === null}
        {...(size ? { size } : {})}
      />
      {respond !== null && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <p aria-live="polite" className="text-sm text-ink-muted">
            {exactCount === null
              ? `${marks.length} marked`
              : `${marks.length} of ${exactCount} marked`}
          </p>
          <Button
            disabled={!ready}
            onClick={() => {
              respond({ format: 'multi-select', indices: marks });
            }}
          >
            {submitLabel}
          </Button>
          {marks.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setMarks([]);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
