import type { CrossRuleName, GridRuleName, NumberCross, WheelRuleName } from './types';

/**
 * Rule libraries and solvers. A rule counts as an explanation only when it holds on at least two
 * complete instances shown (two full rows, two full crosses…); a layout is accepted only when every
 * rule that explains it predicts the same missing number.
 */

type Cells = readonly (readonly (number | null)[])[];
type Pos = readonly [number, number];

/** Σ coefs·values = 0 (linear) or v0 × v1 = v2 (product). */
interface Relation {
  readonly type: 'linear' | 'product';
  readonly coefs: readonly number[];
  readonly tuples: readonly (readonly Pos[])[];
}

const SIZE = 3;
const idx = [0, 1, 2] as const;
const rowTuples: Pos[][] = idx.map((r) => idx.map((c) => [r, c] as const));
const colTuples: Pos[][] = idx.map((c) => idx.map((r) => [r, c] as const));
const rectangles: Pos[][] = [];
for (let i = 0; i < SIZE; i++)
  for (let k = i + 1; k < SIZE; k++)
    for (let j = 0; j < SIZE; j++)
      for (let l = j + 1; l < SIZE; l++)
        rectangles.push([
          [i, j],
          [i, l],
          [k, j],
          [k, l],
        ]);

const RELATIONS: Partial<Record<GridRuleName, Relation>> = {
  'row-sum': { type: 'linear', coefs: [1, 1, -1], tuples: rowTuples },
  'column-sum': { type: 'linear', coefs: [1, 1, -1], tuples: colTuples },
  'row-difference': { type: 'linear', coefs: [1, -1, -1], tuples: rowTuples },
  'column-difference': { type: 'linear', coefs: [1, -1, -1], tuples: colTuples },
  'row-step': { type: 'linear', coefs: [1, -2, 1], tuples: rowTuples },
  'column-step': { type: 'linear', coefs: [1, -2, 1], tuples: colTuples },
  'row-product': { type: 'product', coefs: [], tuples: rowTuples },
  'column-product': { type: 'product', coefs: [], tuples: colTuples },
  'add-table': { type: 'linear', coefs: [1, -1, -1, 1], tuples: rectangles },
};

export const GRID_RULES: readonly GridRuleName[] = [
  'row-sum',
  'column-sum',
  'row-difference',
  'column-difference',
  'row-step',
  'column-step',
  'row-product',
  'column-product',
  'add-table',
  'row-total',
  'column-total',
];

const holds = (relation: Relation, values: readonly number[]) =>
  relation.type === 'product'
    ? (values[0] as number) * (values[1] as number) === values[2]
    : relation.coefs.reduce((sum, k, i) => sum + k * (values[i] as number), 0) === 0;

/** Value of the single unknown (position `u`) that makes the relation hold, or null. */
function solveOne(relation: Relation, values: readonly (number | null)[], u: number) {
  if (relation.type === 'product') {
    const [a, b, c] = values;
    if (u === 2) return (a as number) * (b as number);
    const known = u === 0 ? (b as number) : (a as number);
    if (known === 0 || (c as number) % known !== 0) return null;
    return (c as number) / known;
  }
  const rest = relation.coefs.reduce(
    (sum, k, i) => (i === u ? sum : sum + k * (values[i] as number)),
    0,
  );
  const k = relation.coefs[u] as number;
  return rest % k === 0 ? -rest / k : null;
}

/** Agreeing predictions from instances, or null when inconsistent, unproven or undetermined. */
function fromInstances(
  instances: readonly { complete: boolean; ok: boolean; prediction: number | null }[],
) {
  const complete = instances.filter((i) => i.complete);
  if (complete.length < 2 || !complete.every((i) => i.ok)) return null;
  const solving = instances.filter((i) => !i.complete);
  if (solving.length === 0 || solving.some((i) => i.prediction === null)) return null;
  const values = new Set(solving.map((i) => i.prediction));
  return values.size === 1 ? (solving[0]?.prediction ?? null) : null;
}

function totals(cells: Cells, byRow: boolean) {
  const lines = byRow ? rowTuples : colTuples;
  const instances = lines.map((line) => line.map(([r, c]) => cells[r]?.[c] ?? null));
  const complete = instances.filter((v): v is number[] => v.every((x) => x !== null));
  const sums = new Set(complete.map((v) => v.reduce((a, b) => a + b, 0)));
  if (complete.length < 2 || sums.size !== 1) return null;
  const total = [...sums][0] as number;
  const open = instances.find((v) => v.some((x) => x === null));
  if (!open) return null;
  return total - open.reduce<number>((a, b) => a + (b ?? 0), 0);
}

/** The missing number predicted by one rule, or null when the rule does not explain the grid. */
export function predictGrid(rule: GridRuleName, cells: Cells): number | null {
  if (rule === 'row-total') return totals(cells, true);
  if (rule === 'column-total') return totals(cells, false);
  const relation = RELATIONS[rule];
  if (!relation) return null;
  return fromInstances(
    relation.tuples.map((tuple) => {
      const values = tuple.map(([r, c]) => cells[r]?.[c] ?? null);
      const u = values.indexOf(null);
      return u === -1
        ? { complete: true, ok: holds(relation, values as number[]), prediction: null }
        : { complete: false, ok: true, prediction: solveOne(relation, values, u) };
    }),
  );
}

/** Distinct predictions of every library rule that explains the grid. */
export const gridPredictions = (cells: Cells) =>
  new Set(GRID_RULES.map((rule) => predictGrid(rule, cells)).filter((v) => v !== null));

// ── Wheels ────────────────────────────────────────────────────────────────────────────────────────

export const WHEEL_RULES: readonly WheelRuleName[] = [
  'opposite-sum',
  'opposite-difference',
  'clockwise-step',
];

const lineRelation = (cells: readonly (number | null)[], relation: Relation) =>
  fromInstances(
    relation.tuples.map((tuple) => {
      const values = tuple.map(([, i]) => cells[i] ?? null);
      const u = values.indexOf(null);
      return u === -1
        ? { complete: true, ok: holds(relation, values as number[]), prediction: null }
        : { complete: false, ok: true, prediction: solveOne(relation, values, u) };
    }),
  );

export function predictWheel(rule: WheelRuleName, segments: readonly (number | null)[]) {
  const n = segments.length;
  const half = n / 2;
  if (rule === 'clockwise-step') {
    // Read clockwise from the top segment: each segment is the previous plus a fixed step.
    return lineRelation(segments, {
      type: 'linear',
      coefs: [1, -2, 1],
      tuples: Array.from({ length: n - 2 }, (_, i) => [
        [0, i],
        [0, i + 1],
        [0, i + 2],
      ]),
    });
  }
  const pairs = Array.from({ length: half }, (_, i) => [
    segments[i] ?? null,
    segments[i + half] ?? null,
  ]);
  const value = ([a, b]: (number | null)[]) =>
    rule === 'opposite-sum' ? (a as number) + (b as number) : (a as number) - (b as number);
  const complete = pairs.filter((p) => p.every((x) => x !== null));
  const constants = new Set(complete.map(value));
  if (complete.length < 2 || constants.size !== 1) return null;
  const k = [...constants][0] as number;
  const open = pairs.find((p) => p.some((x) => x === null));
  if (!open) return null;
  const [a, b] = open;
  if (rule === 'opposite-sum') return k - ((a ?? b) as number);
  return a === null ? k + (b as number) : (a as number) - k;
}

export const wheelPredictions = (segments: readonly (number | null)[]) =>
  new Set(WHEEL_RULES.map((rule) => predictWheel(rule, segments)).filter((v) => v !== null));

// ── Crosses ───────────────────────────────────────────────────────────────────────────────────────

export const CROSS_RULES: readonly CrossRuleName[] = [
  'sum',
  'vertical-minus-horizontal',
  'product-sum',
  'product-difference',
];

export function crossCentre(rule: CrossRuleName, { top, right, bottom, left }: NumberCross) {
  switch (rule) {
    case 'sum':
      return top + right + bottom + left;
    case 'vertical-minus-horizontal':
      return top + bottom - (left + right);
    case 'product-sum':
      return top * bottom + left * right;
    case 'product-difference':
      return top * bottom - left * right;
  }
}

export function predictCross(rule: CrossRuleName, crosses: readonly NumberCross[]) {
  const complete = crosses.filter((c) => c.centre !== null);
  const open = crosses.filter((c) => c.centre === null);
  if (complete.length < 2 || open.length !== 1) return null;
  if (!complete.every((c) => crossCentre(rule, c) === c.centre)) return null;
  return crossCentre(rule, open[0] as NumberCross);
}

export const crossPredictions = (crosses: readonly NumberCross[]) =>
  new Set(CROSS_RULES.map((rule) => predictCross(rule, crosses)).filter((v) => v !== null));

// ── Pyramids ──────────────────────────────────────────────────────────────────────────────────────

/**
 * Fills blank bricks by repeated deduction (a brick and one of the two below give the other;
 * two below give the brick). Returns the completed rows and the steps, in order.
 */
export function solvePyramid(rows: readonly (readonly (number | null)[])[]) {
  const grid = rows.map((row) => [...row]);
  const steps: { readonly at: Pos; readonly text: string }[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < grid.length - 1; r++) {
      const row = grid[r] as (number | null)[];
      const below = grid[r + 1] as (number | null)[];
      for (let c = 0; c < row.length; c++) {
        const top = row[c] ?? null;
        const a = below[c] ?? null;
        const b = below[c + 1] ?? null;
        if (top === null && a !== null && b !== null) {
          row[c] = a + b;
          steps.push({ at: [r, c], text: `${a} + ${b} = ${a + b}` });
          changed = true;
        } else if (top !== null && a === null && b !== null) {
          below[c] = top - b;
          steps.push({ at: [r + 1, c], text: `${top} − ${b} = ${top - b}` });
          changed = true;
        } else if (top !== null && a !== null && b === null) {
          below[c + 1] = top - a;
          steps.push({ at: [r + 1, c + 1], text: `${top} − ${a} = ${top - a}` });
          changed = true;
        }
      }
    }
  }
  return { rows: grid, steps };
}
