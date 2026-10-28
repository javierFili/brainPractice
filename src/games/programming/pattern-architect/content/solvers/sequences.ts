import type { SequenceFamily, SequenceRule } from '../types';

/**
 * The term at index `terms.length`, given every term before it. Rules are recurrences, so the same
 * function builds sequences (generator) and checks them (solver).
 */
export function nextTerm(rule: SequenceRule, terms: readonly number[]): number {
  const i = terms.length;
  const back = (k: number) => {
    const value = terms[i - k];
    if (value === undefined) throw new RangeError(`${rule.family} needs ${k} previous terms`);
    return value;
  };
  switch (rule.family) {
    case 'constant-step':
      return back(1) + rule.step;
    case 'alternating-steps':
      return back(1) + (rule.steps[(i - 1) % 2] as number);
    case 'growing-step':
      return back(1) + rule.firstStep + (i - 1) * rule.growth;
    case 'multiply':
      return back(1) * rule.factor;
    case 'interleaved':
      return back(2) + (rule.steps[i % 2] as number);
    case 'step-cycle':
      return back(1) + (rule.steps[(i - 1) % 3] as number);
    case 'multiply-add':
      return back(1) * rule.factor + rule.add;
    case 'sum-of-previous-two':
      return back(1) + back(2);
    case 'alternating-ops': {
      const multiplies = ((i - 1) % 2 === 0) === rule.multiplyFirst;
      return multiplies ? back(1) * rule.factor : back(1) + rule.add;
    }
  }
}

/** Terms a rule cannot derive (it needs them as a starting point). */
export const warmUp = (family: SequenceFamily): number =>
  family === 'interleaved' || family === 'sum-of-previous-two' ? 2 : 1;

export function buildSequence(rule: SequenceRule, start: readonly number[], length: number) {
  const terms = start.slice(0, warmUp(rule.family));
  while (terms.length < length) terms.push(nextTerm(rule, terms));
  return terms;
}

/** Integer division that only succeeds when exact. */
const exactRatio = (a: number, b: number): number | null => (b !== 0 && a % b === 0 ? a / b : null);

/**
 * Parameters of `family` forced by the first terms, or null if the family cannot produce them with
 * integer parameters. Every family's parameters are fully determined by a short prefix, so fitting
 * then verifying the rest is an exhaustive search of that family.
 */
function fit(family: SequenceFamily, t: readonly number[]): SequenceRule | null {
  const [t0 = 0, t1 = 0, t2 = 0, t3 = 0] = t;
  switch (family) {
    case 'constant-step':
      return { family, step: t1 - t0 };
    case 'alternating-steps':
      return { family, steps: [t1 - t0, t2 - t1] };
    case 'growing-step':
      return { family, firstStep: t1 - t0, growth: t2 - t1 - (t1 - t0) };
    case 'multiply': {
      if (t0 === 0) return { family, factor: 1 };
      const factor = exactRatio(t1, t0);
      return factor === null ? null : { family, factor };
    }
    case 'interleaved':
      return { family, steps: [t2 - t0, t3 - t1] };
    case 'step-cycle':
      return { family, steps: [t1 - t0, t2 - t1, t3 - t2] };
    case 'multiply-add': {
      if (t1 === t0) return { family, factor: 1, add: 0 };
      const factor = exactRatio(t2 - t1, t1 - t0);
      return factor === null ? null : { family, factor, add: t1 - factor * t0 };
    }
    case 'sum-of-previous-two':
      return { family };
    case 'alternating-ops':
      return null; // two phases: see fitAlternatingOps
  }
}

function fitAlternatingOps(t: readonly number[], multiplyFirst: boolean): SequenceRule | null {
  // Positions i (1-based step index) where the step is a multiplication.
  let factor: number | null = null;
  let add: number | null = null;
  for (let i = 1; i < t.length; i++) {
    const prev = t[i - 1] as number;
    const curr = t[i] as number;
    const multiplies = ((i - 1) % 2 === 0) === multiplyFirst;
    if (multiplies && factor === null && prev !== 0) {
      factor = exactRatio(curr, prev);
      if (factor === null) return null;
    }
    if (!multiplies && add === null) add = curr - prev;
  }
  return { family: 'alternating-ops', factor: factor ?? 1, add: add ?? 0, multiplyFirst };
}

export const SEQUENCE_FAMILIES: readonly SequenceFamily[] = [
  'constant-step',
  'alternating-steps',
  'growing-step',
  'multiply',
  'interleaved',
  'step-cycle',
  'multiply-add',
  'sum-of-previous-two',
  'alternating-ops',
];

/** True when `rule` reproduces every term after its warm-up terms. */
export function explains(rule: SequenceRule, terms: readonly number[]): boolean {
  for (let i = warmUp(rule.family); i < terms.length; i++) {
    if (nextTerm(rule, terms.slice(0, i)) !== terms[i]) return false;
  }
  return true;
}

export interface SequenceHypothesis {
  readonly rule: SequenceRule;
  readonly next: number;
}

/** Every rule in the catalogue (any integer parameters) that explains the terms, with its prediction. */
export function consistentRules(terms: readonly number[]): SequenceHypothesis[] {
  const candidates = SEQUENCE_FAMILIES.flatMap((family) =>
    family === 'alternating-ops'
      ? [fitAlternatingOps(terms, true), fitAlternatingOps(terms, false)]
      : [fit(family, terms)],
  );
  return candidates
    .filter((rule): rule is SequenceRule => rule !== null && explains(rule, terms))
    .map((rule) => ({ rule, next: nextTerm(rule, terms) }));
}

/** The next term if every consistent rule agrees on it; null when ambiguous or unexplained. */
export function determinedNext(terms: readonly number[]): number | null {
  const predictions = new Set(consistentRules(terms).map((h) => h.next));
  return predictions.size === 1 ? ([...predictions][0] as number) : null;
}

const signed = (n: number) => (n < 0 ? `subtract ${-n}` : `add ${n}`);
const step = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

/** The rule in plain words. */
export function describeSequenceRule(rule: SequenceRule): string {
  switch (rule.family) {
    case 'constant-step':
      return `${signed(rule.step)} each time`;
    case 'alternating-steps':
      return `the steps alternate: ${step(rule.steps[0])}, ${step(rule.steps[1])}, ${step(rule.steps[0])}, ${step(rule.steps[1])}, …`;
    case 'growing-step': {
      const s = [0, 1, 2].map((k) => step(rule.firstStep + k * rule.growth));
      const change = rule.growth < 0 ? `shrinks by ${-rule.growth}` : `grows by ${rule.growth}`;
      return `the step ${change} every time (${s.join(', ')}, …)`;
    }
    case 'multiply':
      return `multiply by ${rule.factor} each time`;
    case 'interleaved':
      return `two sequences take turns: the 1st, 3rd, 5th… terms go ${step(rule.steps[0])}, the 2nd, 4th, 6th… terms go ${step(rule.steps[1])}`;
    case 'step-cycle':
      return `the steps repeat in a cycle of three: ${rule.steps.map(step).join(', ')}`;
    case 'multiply-add':
      return `multiply by ${rule.factor}, then ${signed(rule.add)}`;
    case 'sum-of-previous-two':
      return 'each term is the sum of the two before it';
    case 'alternating-ops':
      return rule.multiplyFirst
        ? `alternately multiply by ${rule.factor} and ${signed(rule.add)}`
        : `alternately ${signed(rule.add)} and multiply by ${rule.factor}`;
  }
}
