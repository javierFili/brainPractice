import type { ColorName, ShapeKind } from '@/games/kit/content';

/**
 * Tile grids: every cell is empty (0) or one of four tiles. Tiles are shape + colour (never colour
 * alone) and every tile shape looks the same after any quarter turn or mirror, so turning or
 * flipping a grid moves tiles without changing how each tile looks.
 */
export type TileGrid = readonly (readonly number[])[];

export interface TileSpec {
  readonly shape: ShapeKind;
  readonly color: ColorName;
  readonly symbol: string;
}

export const EMPTY_SYMBOL = '·';

/** Index = tile value − 1. */
export const TILES: readonly TileSpec[] = [
  { shape: 'square', color: 'blue', symbol: '■' },
  { shape: 'circle', color: 'orange', symbol: '●' },
  { shape: 'diamond', color: 'purple', symbol: '◆' },
  { shape: 'cross', color: 'green', symbol: '✚' },
];

export const tileName = (value: number): string => {
  const tile = TILES[value - 1];
  return tile === undefined ? 'empty' : `${tile.color} ${tile.shape}`;
};

export const rowsOf = (grid: TileGrid) => grid.length;
export const colsOf = (grid: TileGrid) => grid[0]?.length ?? 0;
export const at = (grid: TileGrid, r: number, c: number): number => grid[r]?.[c] ?? 0;

export const makeGrid = (
  rows: number,
  cols: number,
  value: (r: number, c: number) => number,
): number[][] =>
  Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (__, c) => value(r, c)));

export const emptyGrid = (rows: number, cols: number) => makeGrid(rows, cols, () => 0);

export const rotateCW = (g: TileGrid): number[][] =>
  makeGrid(colsOf(g), rowsOf(g), (r, c) => at(g, rowsOf(g) - 1 - c, r));
export const rotateCCW = (g: TileGrid): number[][] =>
  makeGrid(colsOf(g), rowsOf(g), (r, c) => at(g, c, colsOf(g) - 1 - r));
export const rotate180 = (g: TileGrid): number[][] =>
  makeGrid(rowsOf(g), colsOf(g), (r, c) => at(g, rowsOf(g) - 1 - r, colsOf(g) - 1 - c));
/** Mirror left ↔ right. */
export const flipLR = (g: TileGrid): number[][] =>
  makeGrid(rowsOf(g), colsOf(g), (r, c) => at(g, r, colsOf(g) - 1 - c));
/** Mirror top ↔ bottom. */
export const flipUD = (g: TileGrid): number[][] =>
  makeGrid(rowsOf(g), colsOf(g), (r, c) => at(g, rowsOf(g) - 1 - r, c));

export const gridKey = (g: TileGrid): string =>
  g.map((row) => row.map((v) => TILES[v - 1]?.symbol ?? EMPTY_SYMBOL).join('')).join(' / ');

export const sameGrid = (a: TileGrid, b: TileGrid) => gridKey(a) === gridKey(b);

/** Inverse of `gridKey`; null for labels that are not tile grids. */
export function parseGrid(label: string): number[][] | null {
  const rows = label.split(' / ');
  const symbols = [EMPTY_SYMBOL, ...TILES.map((t) => t.symbol)];
  const grid = rows.map((row) => Array.from(row, (ch) => symbols.indexOf(ch)));
  const width = grid[0]?.length ?? 0;
  if (width === 0 || grid.some((row) => row.length !== width || row.includes(-1))) return null;
  return grid;
}

export const cellName = (r: number, c: number) => `row ${r + 1}, column ${c + 1}`;

const listWords = (items: readonly string[]) =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items.at(-1) ?? ''}`;

/** The grid in words, row by row, for screen readers and explanations. */
export function describeGrid(g: TileGrid): string {
  const binary = g.every((row) => row.every((v) => v <= 1));
  const lines = g.map((row, r) => {
    const filled = row.flatMap((v, c) => (v === 0 ? [] : [{ v, c }]));
    if (filled.length === 0) return `row ${r + 1} empty`;
    if (binary)
      return `row ${r + 1} filled at ${filled.length === 1 ? 'column' : 'columns'} ${listWords(filled.map((f) => String(f.c + 1)))}`;
    return `row ${r + 1}: ${filled.map((f) => `${tileName(f.v)} in column ${f.c + 1}`).join(', ')}`;
  });
  return `${rowsOf(g)} by ${colsOf(g)} grid; ${lines.join('; ')}`;
}

export const filledCells = (g: TileGrid): [number, number][] =>
  g.flatMap((row, r) => row.flatMap((v, c) => (v === 0 ? [] : [[r, c] as [number, number]])));

/** Crops a grid to the bounding box of its filled cells. */
export function trim(g: TileGrid): number[][] {
  const cells = filledCells(g);
  if (cells.length === 0) return [[0]];
  const rs = cells.map(([r]) => r);
  const cs = cells.map(([, c]) => c);
  const r0 = Math.min(...rs);
  const c0 = Math.min(...cs);
  return makeGrid(Math.max(...rs) - r0 + 1, Math.max(...cs) - c0 + 1, (r, c) =>
    at(g, r + r0, c + c0),
  );
}

export type Transform = 'identity' | 'cw' | '180' | 'ccw' | 'flip-lr' | 'flip-ud' | 'diag' | 'anti';

export const TRANSFORMS: readonly Transform[] = [
  'identity',
  'cw',
  '180',
  'ccw',
  'flip-lr',
  'flip-ud',
  'diag',
  'anti',
];

export function applyTransform(g: TileGrid, t: Transform): number[][] {
  switch (t) {
    case 'identity':
      return g.map((row) => [...row]);
    case 'cw':
      return rotateCW(g);
    case '180':
      return rotate180(g);
    case 'ccw':
      return rotateCCW(g);
    case 'flip-lr':
      return flipLR(g);
    case 'flip-ud':
      return flipUD(g);
    case 'diag':
      return rotateCW(flipLR(g));
    case 'anti':
      return rotateCCW(flipLR(g));
  }
}

export const ROTATIONS: readonly Transform[] = ['identity', 'cw', '180', 'ccw'];

/** True when all eight turns and mirror images of the grid look different. */
export const isAsymmetric = (g: TileGrid) =>
  new Set(TRANSFORMS.map((t) => gridKey(applyTransform(g, t)))).size === TRANSFORMS.length;
