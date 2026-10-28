import { shuffle, type RandomGenerator } from '@/domain/random';
import type { GridPuzzle } from './types';

/** Cells that must differ from cell `i`: same row, same column, same box. */
function peersOf(size: number, box: GridPuzzle['box']): number[][] {
  return Array.from({ length: size * size }, (_, i) => {
    const r = Math.floor(i / size);
    const c = i % size;
    const peers = new Set<number>();
    for (let k = 0; k < size; k++) {
      peers.add(r * size + k);
      peers.add(k * size + c);
    }
    if (box) {
      const [bh, bw] = box;
      const r0 = r - (r % bh);
      const c0 = c - (c % bw);
      for (let dr = 0; dr < bh; dr++)
        for (let dc = 0; dc < bw; dc++) peers.add((r0 + dr) * size + c0 + dc);
    }
    peers.delete(i);
    return [...peers];
  });
}

/**
 * Backtracking search (fewest-options cell first). Returns up to `limit` solutions; with
 * `random`, values are tried in random order (used to create a random full grid).
 */
export function solveGrid(puzzle: GridPuzzle, limit = 2, random?: RandomGenerator): number[][] {
  const { size, box, inequalities } = puzzle;
  const peers = peersOf(size, box);
  const grid = puzzle.givens.map((v) => v ?? 0);
  const ineqOf = Array.from(
    { length: size * size },
    () => [] as { other: number; less: boolean }[],
  );
  for (const { smaller, larger } of inequalities) {
    ineqOf[smaller]?.push({ other: larger, less: true });
    ineqOf[larger]?.push({ other: smaller, less: false });
  }
  const allowed = (i: number, v: number) => {
    for (const p of peers[i] as number[]) if (grid[p] === v) return false;
    for (const { other, less } of ineqOf[i] as { other: number; less: boolean }[]) {
      const o = grid[other] as number;
      if (o !== 0 && (less ? v >= o : v <= o)) return false;
    }
    return true;
  };
  // Givens must be consistent with each other.
  for (let i = 0; i < grid.length; i++) {
    const v = grid[i] as number;
    if (v === 0) continue;
    grid[i] = 0;
    const ok = allowed(i, v);
    grid[i] = v;
    if (!ok) return [];
  }
  const values = Array.from({ length: size }, (_, k) => k + 1);
  const found: number[][] = [];
  const search = (): void => {
    let best = -1;
    let bestOptions: number[] = [];
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] !== 0) continue;
      const options = values.filter((v) => allowed(i, v));
      if (options.length === 0) return;
      if (best === -1 || options.length < bestOptions.length) {
        best = i;
        bestOptions = options;
        if (options.length === 1) break;
      }
    }
    if (best === -1) {
      found.push([...grid]);
      return;
    }
    for (const v of random ? shuffle(random, bestOptions) : bestOptions) {
      grid[best] = v;
      search();
      grid[best] = 0;
      if (found.length >= limit) return;
    }
  };
  search();
  return found;
}

export const cellName = (index: number, size: number) =>
  `${String.fromCharCode(65 + (index % size))}${Math.floor(index / size) + 1}`;
