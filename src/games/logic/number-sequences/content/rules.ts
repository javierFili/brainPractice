/**
 * A library of simple sequence rules. Each rule is fitted on the first four terms and then
 * generates the whole sequence; the generator only accepts sequences where every rule that fits
 * the visible terms predicts the same hidden term, so the answer never depends on which rule the
 * player happened to think of.
 */
export interface FittedRule {
  readonly id: string;
  readonly terms: readonly number[];
}

type Fit = (t: readonly number[], length: number) => number[] | null;

const build = (
  length: number,
  first: readonly number[],
  next: (s: number[], i: number) => number,
) => {
  const s = [...first];
  while (s.length < length) s.push(next(s, s.length));
  return s.slice(0, length);
};

const at = (t: readonly number[], i: number) => t[i] as number;

const ratio = (a: number, b: number): number | null =>
  a !== 0 && Number.isInteger(b / a) ? b / a : null;

export const RULE_LIBRARY: Readonly<Record<string, Fit>> = {
  add: (t, n) => {
    const d = at(t, 1) - at(t, 0);
    return build(n, [at(t, 0)], (s, i) => at(s, i - 1) + d);
  },
  multiply: (t, n) => {
    const r = ratio(at(t, 0), at(t, 1));
    return r === null ? null : build(n, [at(t, 0)], (s, i) => at(s, i - 1) * r);
  },
  halve: (t, n) => {
    const k = ratio(at(t, 1), at(t, 0));
    return k === null || k === 0 ? null : build(n, [at(t, 0)], (s, i) => at(s, i - 1) / k);
  },
  'alternating-add': (t, n) => {
    const d = [at(t, 1) - at(t, 0), at(t, 2) - at(t, 1)];
    return build(n, [at(t, 0)], (s, i) => at(s, i - 1) + at(d, (i - 1) % 2));
  },
  'growing-add': (t, n) => {
    const d0 = at(t, 1) - at(t, 0);
    const dd = at(t, 2) - at(t, 1) - d0;
    return build(n, [at(t, 0)], (s, i) => at(s, i - 1) + d0 + (i - 1) * dd);
  },
  cubic: (t, n) => {
    // Constant third differences, extended from the first four terms.
    const s = [at(t, 0), at(t, 1), at(t, 2), at(t, 3)];
    while (s.length < n) {
      const k = s.length;
      s.push(at(s, k - 1) * 3 - at(s, k - 2) * 3 + at(s, k - 3));
    }
    return s.slice(0, n);
  },
  interleaved: (t, n) => {
    const d = [at(t, 2) - at(t, 0), at(t, 3) - at(t, 1)];
    return build(n, [at(t, 0), at(t, 1)], (s, i) => at(s, i - 2) + at(d, i % 2));
  },
  'multiply-then-add': (t, n) => {
    const r = ratio(at(t, 0), at(t, 1));
    const b = at(t, 2) - at(t, 1);
    return r === null
      ? null
      : build(n, [at(t, 0)], (s, i) => (i % 2 === 1 ? at(s, i - 1) * r : at(s, i - 1) + b));
  },
  'add-then-multiply': (t, n) => {
    const b = at(t, 1) - at(t, 0);
    const r = ratio(at(t, 1), at(t, 2));
    return r === null
      ? null
      : build(n, [at(t, 0)], (s, i) => (i % 2 === 1 ? at(s, i - 1) + b : at(s, i - 1) * r));
  },
  'times-plus': (t, n) => {
    // s(i) = r × s(i-1) + b, with integer r.
    const d1 = at(t, 1) - at(t, 0);
    const d2 = at(t, 2) - at(t, 1);
    if (d1 === 0) return null;
    const r = d2 / d1;
    if (!Number.isInteger(r)) return null;
    const b = at(t, 1) - r * at(t, 0);
    return build(n, [at(t, 0)], (s, i) => r * at(s, i - 1) + b);
  },
  'sum-of-two': (t, n) => build(n, [at(t, 0), at(t, 1)], (s, i) => at(s, i - 1) + at(s, i - 2)),
  'period-two': (t, n) => build(n, [at(t, 0), at(t, 1)], (s, i) => at(s, i - 2)),
};

/**
 * Every library rule that reproduces all visible terms, with its prediction for the hidden one.
 * `terms[hidden]` is ignored; the first four terms must be visible.
 */
export function fittingRules(terms: readonly number[], hidden: number): FittedRule[] {
  if (hidden < 4) throw new RangeError('The first four terms must be visible');
  return Object.entries(RULE_LIBRARY).flatMap(([id, fit]) => {
    const full = fit(terms, terms.length);
    if (!full || full.some((v) => !Number.isFinite(v))) return [];
    const matches = full.every((v, i) => i === hidden || v === terms[i]);
    return matches ? [{ id, terms: full }] : [];
  });
}

/** The hidden term when every fitting rule agrees on it; null when ambiguous or unexplained. */
export function uniqueHiddenTerm(terms: readonly number[], hidden: number): number | null {
  const predictions = new Set(fittingRules(terms, hidden).map((rule) => rule.terms[hidden]));
  return predictions.size === 1 ? ([...predictions][0] as number) : null;
}
