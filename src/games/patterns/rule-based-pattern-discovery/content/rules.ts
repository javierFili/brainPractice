import { msg, type Message } from '@/domain/shared';
import type { TileGrid } from '../../shared/content';

const T = 'patterns:ruleBasedPatternDiscovery.rule';

/** `move`: turns, mirrors and shifts. `colour`: tiles change kind. `gather`: tiles fall or spread. */
export type RuleFamily = 'move' | 'colour' | 'gather';

/** A square grid flattened row by row; rules run on this form because it is cheap to copy. */
export type Cells = readonly number[];

export interface GridRule {
  readonly id: string;
  readonly family: RuleFamily;
  /** Completes "In every example the grid …": "is mirrored left to right". */
  readonly words: Message;
  /** Runs the rule on an n × n grid given as flat cells. */
  run(cells: Cells, n: number): number[];
}

export const flatten = (grid: TileGrid): number[] => grid.flat();
export const unflatten = (cells: Cells, n: number): number[][] =>
  Array.from({ length: n }, (_, r) => cells.slice(r * n, r * n + n));

export const sameCells = (a: Cells, b: Cells) => a.every((v, i) => v === b[i]);
export const cellsKey = (cells: Cells) => cells.join('');

type Source = (r: number, c: number, n: number) => number;

/** A rule that only moves tiles: out(r, c) = in(source(r, c)). Index maps are cached per size. */
function moveRule(id: string, source: Source): GridRule {
  const cache = new Map<number, number[]>();
  const map = (n: number) => {
    let m = cache.get(n);
    if (m === undefined) {
      m = Array.from({ length: n * n }, (_, i) => source(Math.floor(i / n), i % n, n));
      cache.set(n, m);
    }
    return m;
  };
  return {
    id,
    family: 'move',
    words: msg(`${T}.${id}`),
    run: (cells, n) => map(n).map((j) => cells[j] ?? 0),
  };
}

const wrap = (v: number, n: number) => (v + n) % n;

const MOVES: readonly GridRule[] = [
  moveRule('flip-lr', (r, c, n) => r * n + (n - 1 - c)),
  moveRule('flip-ud', (r, c, n) => (n - 1 - r) * n + c),
  moveRule('cw', (r, c, n) => (n - 1 - c) * n + r),
  moveRule('ccw', (r, c, n) => c * n + (n - 1 - r)),
  moveRule('180', (r, c, n) => (n - 1 - r) * n + (n - 1 - c)),
  moveRule('shift-right', (r, c, n) => r * n + wrap(c - 1, n)),
  moveRule('shift-left', (r, c, n) => r * n + wrap(c + 1, n)),
  moveRule('shift-down', (r, c, n) => wrap(r - 1, n) * n + c),
  moveRule('shift-up', (r, c, n) => wrap(r + 1, n) * n + c),
];

const GATHERS: readonly GridRule[] = [
  {
    id: 'fall',
    family: 'gather',
    words: msg(`${T}.fall`),
    run: (cells, n) => {
      const out = Array.from({ length: n * n }, () => 0);
      for (let c = 0; c < n; c++) {
        let r = n - 1;
        for (let k = n - 1; k >= 0; k--) {
          const v = cells[k * n + c] ?? 0;
          if (v !== 0) out[r-- * n + c] = v;
        }
      }
      return out;
    },
  },
  {
    id: 'slide-left',
    family: 'gather',
    words: msg(`${T}.slide-left`),
    run: (cells, n) => {
      const out = Array.from({ length: n * n }, () => 0);
      for (let r = 0; r < n; r++) {
        let c = 0;
        for (let k = 0; k < n; k++) {
          const v = cells[r * n + k] ?? 0;
          if (v !== 0) out[r * n + c++] = v;
        }
      }
      return out;
    },
  },
  {
    id: 'fill-rows',
    family: 'gather',
    words: msg(`${T}.fill-rows`),
    run: (cells, n) => {
      const out = [...cells];
      for (let r = 0; r < n; r++) {
        const first = cells.slice(r * n, r * n + n).find((v) => v !== 0);
        if (first !== undefined) for (let c = 0; c < n; c++) out[r * n + c] = first;
      }
      return out;
    },
  },
  {
    id: 'fill-columns',
    family: 'gather',
    words: msg(`${T}.fill-columns`),
    run: (cells, n) => {
      const out = [...cells];
      for (let c = 0; c < n; c++) {
        let first = 0;
        for (let r = 0; r < n && first === 0; r++) first = cells[r * n + c] ?? 0;
        if (first !== 0) for (let r = 0; r < n; r++) out[r * n + c] = first;
      }
      return out;
    },
  },
];

const valueRule = (id: string, words: Message, table: readonly number[]): GridRule => ({
  id,
  family: 'colour',
  words,
  run: (cells) => cells.map((v) => table[v] ?? v),
});

/**
 * Every rule the game knows, for grids that use the given tile kinds. Colour rules only mention
 * kinds that appear (others would leave the grid unchanged).
 */
export function ruleLibrary(kinds: readonly number[]): GridRule[] {
  const rules: GridRule[] = [...MOVES, ...GATHERS];
  for (const from of kinds) {
    for (let to = 1; to <= 4; to++) {
      if (to === from) continue;
      const table = [0, 1, 2, 3, 4];
      table[from] = to;
      rules.push(
        valueRule(
          `recolour-${from}-${to}`,
          // Tile names come from per-tile forms in the translations (articles, plurals, gender).
          msg(`${T}.recolour`, { from: String(from), to: String(to) }),
          table,
        ),
      );
      if (to > from && kinds.includes(to)) {
        const swap = [0, 1, 2, 3, 4];
        swap[from] = to;
        swap[to] = from;
        rules.push(
          valueRule(
            `swap-${from}-${to}`,
            msg(`${T}.swap`, { from: String(from), to: String(to) }),
            swap,
          ),
        );
      }
    }
  }
  return rules;
}

/** One-step rules and, when asked, every two-step chain (first, then second). */
export function chains(library: readonly GridRule[], steps: 1 | 2): GridRule[][] {
  const singles = library.map((r) => [r]);
  if (steps === 1) return singles;
  return [...singles, ...library.flatMap((a) => library.map((b) => [a, b]))];
}

export const runChain = (chain: readonly GridRule[], cells: Cells, n: number): Cells =>
  chain.reduce<Cells>((g, rule) => rule.run(g, n), cells);

export const applyChain = (chain: readonly GridRule[], grid: TileGrid): number[][] =>
  unflatten(runChain(chain, flatten(grid), grid.length), grid.length);
