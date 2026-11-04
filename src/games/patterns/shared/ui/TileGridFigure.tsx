import type { ReactNode } from 'react';
import type { Text } from '@/domain/shared';
import { useText } from '@/i18n';
import { describeGrid, TILES, type TileGrid } from '../content/tiles';

/** Small static picture of a tile grid. Each tile has its own shape, so colour is never needed. */
const TILE: Record<number, (x: number, y: number) => ReactNode> = {
  1: (x, y) => (
    <rect x={x + 2} y={y + 2} width={16} height={16} rx={2} className="fill-glyph-blue" />
  ),
  2: (x, y) => <circle cx={x + 10} cy={y + 10} r={8} className="fill-glyph-orange" />,
  3: (x, y) => <path d={`M${x + 10} ${y + 1}l9 9-9 9-9-9Z`} className="fill-glyph-purple" />,
  4: (x, y) => (
    <path
      d={`M${x + 7} ${y + 2}h6v5h5v6h-5v5H${x + 7}v-5H${x + 2}V${y + 7}h5Z`}
      className="fill-glyph-green"
    />
  ),
};

interface Props {
  readonly grid: TileGrid;
  /** Accessible name; defaults to the grid described in words. Ignored when decorative. */
  readonly label?: Text;
  readonly decorative?: boolean;
  readonly className?: string;
  /** Cells drawn with a highlighted border (e.g. the marks to reproduce). */
  readonly highlight?: readonly (readonly [number, number])[];
}

export function TileGridFigure({
  grid,
  label,
  decorative = false,
  className = 'w-24 sm:w-28',
  highlight = [],
}: Props) {
  const tx = useText();
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const lit = new Set(highlight.map(([r, c]) => `${r}:${c}`));
  return (
    <svg
      viewBox={`-1 -1 ${cols * 20 + 2} ${rows * 20 + 2}`}
      className={`${className} shrink-0`}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': tx(label ?? describeGrid(grid)) })}
    >
      {grid.map((row, r) =>
        row.map((value, c) => (
          <g key={`${r}:${c}`}>
            <rect
              x={c * 20}
              y={r * 20}
              width={20}
              height={20}
              className={
                lit.has(`${r}:${c}`) ? 'fill-raised stroke-glow' : 'fill-raised stroke-line'
              }
              strokeWidth={lit.has(`${r}:${c}`) ? 2 : 1}
            />
            {value > 0 && value <= TILES.length && TILE[value]?.(c * 20, r * 20)}
          </g>
        )),
      )}
    </svg>
  );
}
