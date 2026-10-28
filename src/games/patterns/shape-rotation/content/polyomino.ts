import { pick, randomInt, type RandomGenerator } from '@/domain/random';
import {
  applyTransform,
  gridKey,
  makeGrid,
  ROTATIONS,
  TRANSFORMS,
  trim,
  type TileGrid,
} from '../../shared/content';

/** Pieces made of edge-joined squares, as sets of `row:col` cells. */
type Cells = readonly (readonly [number, number])[];

const STEPS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
] as const;

export function toGrid(cells: Cells): number[][] {
  const r0 = Math.min(...cells.map(([r]) => r));
  const c0 = Math.min(...cells.map(([, c]) => c));
  const set = new Set(cells.map(([r, c]) => `${r - r0}:${c - c0}`));
  const rows = Math.max(...cells.map(([r]) => r)) - r0 + 1;
  const cols = Math.max(...cells.map(([, c]) => c)) - c0 + 1;
  return makeGrid(rows, cols, (r, c) => (set.has(`${r}:${c}`) ? 1 : 0));
}

const has = (cells: Cells, r: number, c: number) => cells.some(([a, b]) => a === r && b === c);

export function isConnected(cells: Cells): boolean {
  if (cells.length === 0) return false;
  const seen = new Set<string>();
  const stack = [cells[0] as readonly [number, number]];
  while (stack.length > 0) {
    const [r, c] = stack.pop() as readonly [number, number];
    const key = `${r}:${c}`;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const [dr, dc] of STEPS) if (has(cells, r + dr, c + dc)) stack.push([r + dr, c + dc]);
  }
  return seen.size === cells.length;
}

/** A random piece of `size` squares grown one neighbour at a time. */
export function randomPiece(random: RandomGenerator, size: number): [number, number][] {
  const cells: [number, number][] = [[0, 0]];
  while (cells.length < size) {
    const [r, c] = pick(random, cells);
    const [dr, dc] = pick(random, STEPS);
    if (!has(cells, r + dr, c + dc)) cells.push([r + dr, c + dc]);
  }
  return cells;
}

/** The same piece with one square moved elsewhere (still in one piece), or null. */
export function nearPiece(random: RandomGenerator, cells: Cells): [number, number][] | null {
  const removed = randomInt(random, 0, cells.length - 1);
  const rest = cells.filter((_, i) => i !== removed);
  const [r, c] = pick(random, rest);
  const [dr, dc] = pick(random, STEPS);
  const old = cells[removed] as readonly [number, number];
  if (has(rest, r + dr, c + dc) || (old[0] === r + dr && old[1] === c + dc)) return null;
  const next = [
    ...rest.map(([a, b]) => [a, b] as [number, number]),
    [r + dr, c + dc] as [number, number],
  ];
  return isConnected(next) ? next : null;
}

/** Key shared by a piece and all its turns and mirror images. */
export const shapeClass = (g: TileGrid) =>
  TRANSFORMS.map((t) => gridKey(trim(applyTransform(g, t))))
    .sort()
    .at(0) as string;

/** True when `option` is `piece` turned by 0, 90, 180 or 270 degrees (no flip). */
export const isRotationOf = (option: TileGrid, piece: TileGrid) =>
  ROTATIONS.some((t) => gridKey(trim(applyTransform(piece, t))) === gridKey(trim(option)));

const MAPS: readonly ((r: number, c: number) => readonly [number, number])[] = [
  (r, c) => [r, c],
  (r, c) => [c, -r],
  (r, c) => [-r, -c],
  (r, c) => [-c, r],
  (r, c) => [r, -c],
  (r, c) => [-r, c],
  (r, c) => [c, r],
  (r, c) => [-c, -r],
];

/**
 * Fast form of `shapeClass` + `isAsymmetric` straight from cells: the eight turned/flipped
 * normalised cell lists, their smallest key (the class) and whether all eight differ.
 */
export function pieceSignature(cells: Cells): {
  readonly kind: string;
  readonly asymmetric: boolean;
} {
  const keys = MAPS.map((map) => {
    const moved = cells.map(([r, c]) => map(r, c));
    const r0 = Math.min(...moved.map(([r]) => r));
    const c0 = Math.min(...moved.map(([, c]) => c));
    return moved
      .map(([r, c]) => (r - r0) * 16 + (c - c0))
      .sort((a, b) => a - b)
      .join(',');
  });
  return { kind: [...keys].sort()[0] as string, asymmetric: new Set(keys).size === keys.length };
}
