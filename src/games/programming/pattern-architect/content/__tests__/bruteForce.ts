/**
 * Independent, deliberately naive solvers used only by tests. They share no search code with the
 * generators: sequences are checked by brute force over bounded parameters, grids by trying every
 * possible completion against whole-grid rules, programs by enumerating every chain of operations
 * without any pruning, and graphs by a canonical form over all node permutations.
 */
import { SHAPE_GLYPHS } from '../format';
import type { Digraph, GridCell, Shape } from '../types';
import { SHAPES } from '../types';

// ── Sequences ─────────────────────────────────────────────────────────────────────────────────────

const range = (min: number, max: number) =>
  Array.from({ length: max - min + 1 }, (_, i) => min + i);
const R = range(-12, 12);
const FACTORS = range(-4, 4);

interface Recurrence {
  readonly warm: number;
  next(prev: readonly number[], i: number): number;
}

function* recurrences(): Generator<Recurrence> {
  for (const d of R) yield { warm: 1, next: (p, i) => (p[i - 1] as number) + d };
  for (const a of R)
    for (const b of R) {
      yield { warm: 1, next: (p, i) => (p[i - 1] as number) + (i % 2 === 1 ? a : b) };
      yield { warm: 1, next: (p, i) => (p[i - 1] as number) + a + (i - 1) * b };
      yield { warm: 2, next: (p, i) => (p[i - 2] as number) + (i % 2 === 0 ? a : b) };
      for (const c of R)
        yield {
          warm: 1,
          next: (p, i) => (p[i - 1] as number) + ([a, b, c][(i - 1) % 3] as number),
        };
    }
  for (const f of FACTORS)
    for (const c of range(-15, 15)) {
      yield { warm: 1, next: (p, i) => (p[i - 1] as number) * f + c };
      yield {
        warm: 1,
        next: (p, i) => ((i - 1) % 2 === 0 ? (p[i - 1] as number) * f : (p[i - 1] as number) + c),
      };
      yield {
        warm: 1,
        next: (p, i) => ((i - 1) % 2 === 0 ? (p[i - 1] as number) + c : (p[i - 1] as number) * f),
      };
    }
  yield { warm: 2, next: (p, i) => (p[i - 1] as number) + (p[i - 2] as number) };
}

/** Next terms predicted by every bounded rule that reproduces the whole sequence. */
export function sequencePredictions(terms: readonly number[]): Set<number> {
  const predictions = new Set<number>();
  for (const rule of recurrences()) {
    let fits = true;
    for (let i = rule.warm; i < terms.length && fits; i++) fits = rule.next(terms, i) === terms[i];
    if (fits) predictions.add(rule.next(terms, terms.length));
  }
  return predictions;
}

// ── Grids ─────────────────────────────────────────────────────────────────────────────────────────

type Full = readonly (readonly (string | number)[])[];

const cols = (g: Full): Full => g.map((_, c) => g.map((row) => row[c] as string | number));
const allSame = (line: readonly (string | number)[]) => new Set(line).size === 1;
const sorted = (line: readonly (string | number)[]) => line.map(String).sort().join();
const arithmetic = (line: readonly (string | number)[]) =>
  line.every(
    (v, i) =>
      i < 2 ||
      (v as number) - (line[i - 1] as number) === (line[1] as number) - (line[0] as number),
  );
const sums = (line: readonly (string | number)[]) =>
  line.at(-1) === line.slice(0, -1).reduce<number>((a, b) => a + (b as number), 0);

const WHOLE_GRID_RULES: readonly ((g: Full) => boolean)[] = [
  (g) => allSame(g.flat()),
  (g) => g.every(allSame),
  (g) => cols(g).every(allSame),
  (g) =>
    g.every((row, r) => r === 0 || row.every((v, c) => v === g[r - 1]?.[(c + 1) % row.length])),
  (g) =>
    g.every(
      (row, r) =>
        r === 0 || row.every((v, c) => v === g[r - 1]?.[(c - 1 + row.length) % row.length]),
    ),
  (g) => g.every((row) => sorted(row) === sorted(g[0] ?? [])),
  (g) => cols(g).every((col) => sorted(col) === sorted(cols(g)[0] ?? [])),
];
const NUMERIC_RULES: readonly ((g: Full) => boolean)[] = [
  (g) => g.every(arithmetic),
  (g) => cols(g).every(arithmetic),
  (g) => g.every(sums),
  (g) => cols(g).every(sums),
];

/** Every value for the missing cell that makes the attribute follow at least one whole-grid rule. */
export function acceptedCompletions(
  cells: readonly (readonly (GridCell | null)[])[],
  attribute: 'shape' | 'count',
): Set<string | number> {
  const candidates: readonly (string | number)[] = attribute === 'shape' ? SHAPES : range(1, 9);
  const rules = attribute === 'shape' ? WHOLE_GRID_RULES : [...WHOLE_GRID_RULES, ...NUMERIC_RULES];
  const accepted = new Set<string | number>();
  for (const value of candidates) {
    const full = cells.map((row) => row.map((cell) => (cell === null ? value : cell[attribute])));
    if (rules.some((rule) => rule(full))) accepted.add(value);
  }
  return accepted;
}

const SHAPE_BY_GLYPH = new Map(
  Object.entries(SHAPE_GLYPHS).map(([shape, glyph]) => [glyph, shape as Shape]),
);

/** Reads an option label such as `▲▲▲` back into a cell. */
export function parseCell(label: string): GridCell {
  const glyphs = Array.from(label);
  const shape = SHAPE_BY_GLYPH.get(glyphs[0] as string);
  if (shape === undefined || glyphs.some((g) => g !== glyphs[0]))
    throw new Error(`Not a cell: ${label}`);
  return { shape, count: glyphs.length };
}

// ── Programs ──────────────────────────────────────────────────────────────────────────────────────

/** Every chain of 0…maxDepth operations, without any pruning. */
export function* allPrograms<O>(operations: readonly O[], maxDepth: number): Generator<O[]> {
  yield [];
  if (maxDepth === 0) return;
  for (const prefix of allPrograms(operations, maxDepth - 1))
    if (prefix.length === maxDepth - 1) for (const op of operations) yield [...prefix, op];
}

export interface ProgramCheck {
  /** Question outputs of every program that reproduces all examples. */
  readonly predictions: Set<string>;
  readonly shortest: number;
}

export function checkPrograms<V, O>(
  operations: readonly O[],
  apply: (op: O, value: V) => V,
  key: (value: V) => string,
  examples: readonly { input: V; output: V }[],
  question: V,
  maxDepth: number,
): ProgramCheck {
  const run = (program: readonly O[], value: V) => program.reduce((v, op) => apply(op, v), value);
  const predictions = new Set<string>();
  let shortest = Infinity;
  for (const program of allPrograms(operations, maxDepth)) {
    if (examples.every(({ input, output }) => key(run(program, input)) === key(output))) {
      predictions.add(key(run(program, question)));
      shortest = Math.min(shortest, program.length);
    }
  }
  return { predictions, shortest };
}

// ── Graphs ────────────────────────────────────────────────────────────────────────────────────────

function permutations(n: number): number[][] {
  if (n === 0) return [[]];
  return permutations(n - 1).flatMap((p) =>
    Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]),
  );
}

/** Smallest arrow list over every renaming of the nodes: equal iff the graphs are isomorphic. */
export function canonicalForm(graph: Digraph): string {
  const index = new Map(graph.nodes.map((node, i) => [node, i]));
  let best: string | null = null;
  for (const perm of permutations(graph.nodes.length)) {
    const code = graph.edges
      .map(([a, b]) => `${perm[index.get(a) as number]}>${perm[index.get(b) as number]}`)
      .sort()
      .join(',');
    if (best === null || code < best) best = code;
  }
  return `${graph.nodes.length}:${best ?? ''}`;
}
