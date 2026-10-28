import type { MatrixRule } from './types';

/** A feature encoded as numbers (shape and colour by index); null marks the missing cell. */
export type Layer = readonly (readonly (number | null)[])[];

export interface RuleFit {
  readonly rule: MatrixRule;
  /** Value predicted for the missing cell; null when the rule fits but cannot decide it. */
  readonly prediction: number | null;
}

const KEYED: readonly [MatrixRule, (r: number, c: number, n: number) => number][] = [
  ['constant', () => 0],
  ['by-row', (r) => r],
  ['by-column', (_r, c) => c],
  ['latin-down', (r, c, n) => (r + c) % n],
  ['latin-up', (r, c, n) => (r - c + n) % n],
];

const norm = (v: number, modulo: number | null) =>
  modulo === null ? v : ((v % modulo) + modulo) % modulo;

function missingOf(layer: Layer): [number, number] {
  for (let r = 0; r < layer.length; r++) {
    const c = (layer[r] as (number | null)[]).indexOf(null);
    if (c >= 0) return [r, c];
  }
  throw new Error('No missing cell');
}

/** Rules whose value depends only on a key of the position (row, column, diagonal). */
function keyedFit(layer: Layer, key: (r: number, c: number, n: number) => number) {
  const n = layer.length;
  const seen = new Map<number, number>();
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const v = layer[r]?.[c];
      if (v === null || v === undefined) continue;
      const k = key(r, c, n);
      const known = seen.get(k);
      if (known !== undefined && known !== v) return undefined;
      seen.set(k, v);
    }
  const [mr, mc] = missingOf(layer);
  return seen.get(key(mr, mc, n)) ?? null;
}

/** value = base(line) + step × position along the line, the same step for every line. */
function stepFit(
  layer: Layer,
  alongRows: boolean,
  steps: readonly number[],
  modulo: number | null,
) {
  const n = layer.length;
  const get = (line: number, pos: number) => (alongRows ? layer[line]?.[pos] : layer[pos]?.[line]);
  const [mr, mc] = missingOf(layer);
  const [missingLine, missingPos] = alongRows ? [mr, mc] : [mc, mr];
  const predictions = new Set<number | null>();
  for (const step of steps) {
    let consistent = true;
    let prediction: number | null = null;
    for (let line = 0; line < n && consistent; line++) {
      let base: number | null = null;
      for (let pos = 0; pos < n; pos++) {
        const v = get(line, pos);
        if (v === null || v === undefined) continue;
        const b = norm(v - step * pos, modulo);
        if (base !== null && base !== b) consistent = false;
        base = b;
      }
      if (line === missingLine)
        prediction = base === null ? null : norm(base + step * missingPos, modulo);
    }
    if (consistent) predictions.add(prediction);
  }
  return [...predictions];
}

/**
 * Every rule of the library that fits the visible cells of one feature, with its prediction for
 * the missing cell. Steps are tried for counts (−3…3) and directions (any quarter turn).
 */
export function fitRules(layer: Layer, numeric: 'count' | 'rotation' | null): RuleFit[] {
  const fits: RuleFit[] = [];
  for (const [rule, key] of KEYED) {
    const prediction = keyedFit(layer, key);
    if (prediction !== undefined) fits.push({ rule, prediction });
  }
  if (numeric !== null) {
    const steps = numeric === 'count' ? [-3, -2, -1, 1, 2, 3] : [90, 180, 270];
    const modulo = numeric === 'count' ? null : 360;
    for (const [rule, alongRows] of [
      ['step-row', true],
      ['step-column', false],
    ] as const) {
      for (const prediction of stepFit(layer, alongRows, steps, modulo))
        fits.push({ rule, prediction });
    }
  }
  return fits;
}

/** The single value every fitting rule agrees on, or null when the feature is not determined. */
export function solveLayer(layer: Layer, numeric: 'count' | 'rotation' | null): number | null {
  const fits = fitRules(layer, numeric);
  if (fits.length === 0 || fits.some((f) => f.prediction === null)) return null;
  const values = new Set(fits.map((f) => f.prediction));
  return values.size === 1 ? (fits[0]?.prediction ?? null) : null;
}
