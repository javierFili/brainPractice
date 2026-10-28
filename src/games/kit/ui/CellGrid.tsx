import type { ReactNode } from 'react';

/**
 * Visual state of one cell. Review states always add a text mark (✓ / ✗ / •) next to the colour so
 * results never depend on colour alone.
 */
export type CellState = 'idle' | 'marked' | 'hit' | 'missed' | 'wrong' | 'highlight' | 'dim';

const TONE: Record<CellState, string> = {
  idle: 'border-line bg-raised hover:border-line-strong',
  marked: 'border-brand bg-brand/20 ring-2 ring-brand/60',
  hit: 'border-success bg-success/15',
  missed: 'border-warning bg-warning/10 border-dashed',
  wrong: 'border-danger bg-danger/15',
  highlight: 'border-glow bg-glow/15',
  dim: 'border-line/60 bg-surface opacity-60',
};

const MARK: Partial<Record<CellState, string>> = {
  hit: '✓',
  missed: '•',
  wrong: '✗',
};

const STATE_WORDS: Partial<Record<CellState, string>> = {
  marked: 'selected',
  hit: 'correct',
  missed: 'missed',
  wrong: 'wrong',
};

export interface GridCell {
  readonly key: string;
  /** Accessible name of the cell, e.g. "row 2, column 3, blue star". */
  readonly label: string;
  readonly content?: ReactNode;
  readonly state?: CellState;
}

interface Props {
  readonly cells: readonly GridCell[];
  readonly columns: number;
  readonly label: string;
  /** Present when the cells can be pressed; absent renders a static grid. */
  readonly onPress?: (index: number) => void;
  readonly disabled?: boolean;
  /** Cell size: grids with many cells use smaller cells to fit a phone without scrolling. */
  readonly size?: 'sm' | 'md' | 'lg';
}

const SIZE = { sm: 'min-h-10', md: 'min-h-14', lg: 'min-h-20' } as const;

/**
 * A square-celled grid that fits its container. Pressable cells are real buttons (Tab, Enter,
 * arrows via the challenge stage); static cells are list items with the same names.
 */
export function CellGrid({ cells, columns, label, onPress, disabled = false, size = 'md' }: Props) {
  const interactive = onPress !== undefined;
  return (
    <div
      role={interactive ? 'group' : 'list'}
      aria-label={label}
      className="mx-auto grid w-full max-w-xl gap-1.5 sm:gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {cells.map((cell, index) => {
        const state = cell.state ?? 'idle';
        const mark = MARK[state];
        const words = STATE_WORDS[state];
        const className = `relative flex aspect-square ${SIZE[size]} items-center justify-center rounded-lg border text-lg transition-colors ${TONE[state]}`;
        const body = (
          <>
            {cell.content}
            {mark !== undefined && (
              <span aria-hidden="true" className="absolute top-0.5 right-1 text-xs font-bold">
                {mark}
              </span>
            )}
          </>
        );
        const name = words === undefined ? cell.label : `${cell.label}, ${words}`;
        return interactive ? (
          <button
            key={cell.key}
            type="button"
            aria-label={name}
            aria-pressed={state === 'marked'}
            disabled={disabled}
            onClick={() => {
              onPress(index);
            }}
            className={`${className} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-default`}
          >
            {body}
          </button>
        ) : (
          <div key={cell.key} role="listitem" aria-label={name} className={className}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
