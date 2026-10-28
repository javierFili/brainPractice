import type { GridAttribute, GridCell } from '../types';

/**
 * Hypotheses the solver tries for each attribute. Broader than what the generator uses: besides
 * the generator's rules it also considers "every row holds the same set of values" and
 * progressions whose step differs per row, so uniqueness is checked against more readings than
 * the one that built the grid.
 */
export const GRID_HYPOTHESES = [
  'constant',
  'by-row',
  'by-column',
  'shift-left',
  'shift-right',
  'row-set',
  'column-set',
  'row-progression',
  'column-progression',
  'row-sum',
  'column-sum',
] as const;

export type GridHypothesis = (typeof GRID_HYPOTHESES)[number];

type Value = string | number;
/** One attribute of every cell; `null` marks the missing cell. */
export type Layer = readonly (readonly (Value | null)[])[];

export interface Position {
  readonly row: number;
  readonly column: number;
}

export function missingPosition(cells: readonly (readonly (GridCell | null)[])[]): Position {
  for (const [row, line] of cells.entries()) {
    const column = line.indexOf(null);
    if (column >= 0) return { row, column };
  }
  throw new Error('Grid has no missing cell');
}

export function layerOf(
  cells: readonly (readonly (GridCell | null)[])[],
  attribute: GridAttribute,
): Layer {
  return cells.map((line) => line.map((cell) => (cell === null ? null : cell[attribute])));
}

const transpose = (layer: Layer): Layer =>
  (layer[0] ?? []).map((_, c) => layer.map((line) => line[c] ?? null));
const flip = ({ row, column }: Position): Position => ({ row: column, column: row });

/** Cells that must share a value under a categorical rule. */
function classOf(
  hypothesis: 'constant' | 'by-row' | 'by-column' | 'shift-left' | 'shift-right',
  { row, column }: Position,
  size: number,
): number {
  switch (hypothesis) {
    case 'constant':
      return 0;
    case 'by-row':
      return row;
    case 'by-column':
      return column;
    case 'shift-left':
      return (row + column) % size;
    case 'shift-right':
      return (column - row + size) % size;
  }
}

interface Reading {
  readonly consistent: boolean;
  /** What the hypothesis says the missing cell is, even when other cells contradict it. */
  readonly prediction: Value | null;
}

function categorical(
  hypothesis: 'constant' | 'by-row' | 'by-column' | 'shift-left' | 'shift-right',
  layer: Layer,
  missing: Position,
): Reading {
  const size = layer.length;
  const classes = new Map<number, Value[]>();
  layer.forEach((line, row) => {
    line.forEach((value, column) => {
      if (value === null) return;
      const key = classOf(hypothesis, { row, column }, size);
      classes.set(key, [...(classes.get(key) ?? []), value]);
    });
  });
  const consistent = [...classes.values()].every((values) => new Set(values).size === 1);
  const prediction = classes.get(classOf(hypothesis, missing, size))?.[0] ?? null;
  return { consistent, prediction };
}

const sortedKey = (values: readonly Value[]) => values.map(String).sort().join('|');

/** Every row is an arrangement of the same values (like a row of a Sudoku). */
function rowSet(layer: Layer, missing: Position): Reading {
  const complete = layer.filter((_, row) => row !== missing.row) as readonly (readonly Value[])[];
  const reference = complete[0];
  if (reference === undefined) return { consistent: false, prediction: null };
  const consistent = complete.every((line) => sortedKey(line) === sortedKey(reference));
  const remaining = [...reference];
  for (const value of layer[missing.row] ?? []) {
    if (value === null) continue;
    const at = remaining.indexOf(value);
    if (at < 0) return { consistent: false, prediction: null };
    remaining.splice(at, 1);
  }
  return { consistent, prediction: remaining[0] ?? null };
}

/** Every row is an arithmetic progression (each row may use its own step). */
function rowProgression(layer: Layer, missing: Position): Reading {
  const isArithmetic = (line: readonly number[]) =>
    line.every(
      (v, i) => i < 2 || v - (line[i - 1] as number) === (line[1] as number) - (line[0] as number),
    );
  const complete = layer.filter((_, row) => row !== missing.row) as readonly (readonly number[])[];
  const consistentRows = complete.every(isArithmetic);
  const line = layer[missing.row] ?? [];
  const known = line.flatMap((v, i) => (v === null ? [] : [{ i, v: v as number }]));
  const [first, second] = known;
  if (first === undefined || second === undefined) return { consistent: false, prediction: null };
  const stepValue = (second.v - first.v) / (second.i - first.i);
  const fits =
    Number.isInteger(stepValue) &&
    known.every(({ i, v }) => v === first.v + (i - first.i) * stepValue);
  const prediction = first.v + (missing.column - first.i) * stepValue;
  return {
    consistent: consistentRows && fits && Number.isInteger(prediction) && prediction >= 1,
    prediction: Number.isInteger(prediction) && prediction >= 1 ? prediction : null,
  };
}

/** The last value of every row is the sum of the others. */
function rowSum(layer: Layer, missing: Position): Reading {
  const sums = (line: readonly number[]) =>
    line.at(-1) === line.slice(0, -1).reduce((a, b) => a + b, 0);
  const complete = layer.filter((_, row) => row !== missing.row) as readonly (readonly number[])[];
  const line = (layer[missing.row] ?? []) as readonly (number | null)[];
  const size = line.length;
  const othersSum = line
    .slice(0, -1)
    .reduce<number>((sum, v, i) => (i === missing.column ? sum : sum + (v ?? 0)), 0);
  const prediction = missing.column === size - 1 ? othersSum : (line[size - 1] ?? 0) - othersSum;
  const valid = prediction >= 1;
  return { consistent: complete.every(sums) && valid, prediction: valid ? prediction : null };
}

/** How `hypothesis` reads the layer: whether it fits every visible cell and what it predicts. */
export function readLayer(hypothesis: GridHypothesis, layer: Layer, missing: Position): Reading {
  const numeric = layer.every((line) => line.every((v) => v === null || typeof v === 'number'));
  switch (hypothesis) {
    case 'constant':
    case 'by-row':
    case 'by-column':
    case 'shift-left':
    case 'shift-right':
      return categorical(hypothesis, layer, missing);
    case 'row-set':
      return rowSet(layer, missing);
    case 'column-set':
      return rowSet(transpose(layer), flip(missing));
    case 'row-progression':
      return numeric ? rowProgression(layer, missing) : { consistent: false, prediction: null };
    case 'column-progression':
      return numeric
        ? rowProgression(transpose(layer), flip(missing))
        : { consistent: false, prediction: null };
    case 'row-sum':
      return numeric ? rowSum(layer, missing) : { consistent: false, prediction: null };
    case 'column-sum':
      return numeric
        ? rowSum(transpose(layer), flip(missing))
        : { consistent: false, prediction: null };
  }
}

export interface LayerAnalysis {
  /** Hypotheses that fit every visible cell, with their prediction. */
  readonly consistent: readonly { hypothesis: GridHypothesis; value: Value }[];
  /** The value every consistent hypothesis agrees on; null when they disagree or none fits. */
  readonly determined: Value | null;
  /** Predictions of hypotheses that do NOT fit: plausible misreadings. */
  readonly misreadings: readonly Value[];
}

export function analyseLayer(layer: Layer, missing: Position): LayerAnalysis {
  const readings = GRID_HYPOTHESES.map((hypothesis) => ({
    hypothesis,
    ...readLayer(hypothesis, layer, missing),
  }));
  const consistent = readings.flatMap(({ hypothesis, consistent: ok, prediction }) =>
    ok && prediction !== null ? [{ hypothesis, value: prediction }] : [],
  );
  const values = new Set(consistent.map((c) => c.value));
  const unpredictable = readings.some((r) => r.consistent && r.prediction === null);
  return {
    consistent,
    determined: values.size === 1 && !unpredictable ? ([...values][0] as Value) : null,
    misreadings: readings.flatMap(({ consistent: ok, prediction }) =>
      !ok && prediction !== null ? [prediction] : [],
    ),
  };
}

/** The missing cell if both attributes are determined independently; null otherwise. */
export function solveGrid(cells: readonly (readonly (GridCell | null)[])[]): GridCell | null {
  const missing = missingPosition(cells);
  const shape = analyseLayer(layerOf(cells, 'shape'), missing).determined;
  const count = analyseLayer(layerOf(cells, 'count'), missing).determined;
  if (typeof shape !== 'string' || typeof count !== 'number') return null;
  return { shape: shape as GridCell['shape'], count };
}
