import { pick, randomInt, type RandomGenerator } from '@/domain/random';
import type { NumberComparisonProfile, Quantity } from './types';

const int = (value: number): Quantity => ({ label: String(value), num: value, den: 1 });

/** Exact three-way comparison of two quantities by cross-multiplication. */
export const compareQuantities = (a: Quantity, b: Quantity) => a.num * b.den - b.num * a.den;

/**
 * Integers with `digits` digits. Close sets share the leading digits, so the decision rests on
 * the last ones (4719 vs 4791).
 */
export function integers(
  random: RandomGenerator,
  count: number,
  { digits, closeness }: NumberComparisonProfile,
): Quantity[] {
  const low = digits === 1 ? 1 : 10 ** (digits - 1);
  const high = 10 ** digits - 1;
  const spread = Math.max(count + 1, Math.round((high - low) * (1 - closeness) ** 2));
  const start = randomInt(random, low, Math.max(low, high - spread));
  const end = Math.min(high, start + spread);
  // One-digit numbers far apart: at least 2 apart so the easiest level stays easy.
  const gap = digits === 1 && closeness < 0.5 ? 2 : 1;
  const values = new Set<number>();
  while (values.size < count) {
    const v = randomInt(random, start, end);
    if ([...values].every((other) => Math.abs(other - v) >= gap)) values.add(v);
  }
  return [...values].map(int);
}

/** "0.5", "0.45", "0.405": different lengths, so "longer means larger" fails. */
export function decimals(
  random: RandomGenerator,
  count: number,
  { closeness }: NumberComparisonProfile,
): Quantity[] {
  // Values in thousandths; close sets stay inside one tenth (plus its upper neighbour).
  const width = Math.round(100 + 800 * (1 - closeness));
  const start = randomInt(random, 100, 990 - width);
  const values = new Set<number>();
  while (values.size < count) {
    const places = randomInt(random, 1, 3);
    const unit = 10 ** (3 - places);
    const v = Math.ceil(randomInt(random, start, start + width) / unit) * unit;
    if (v > 0 && v < 1000) values.add(v);
  }
  return [...values].map((thousandths) => ({
    label: String(thousandths / 1000),
    num: thousandths,
    den: 1000,
  }));
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Proper fractions in lowest terms with denominators 2–12, all different in value. */
export function fractions(
  random: RandomGenerator,
  count: number,
  { closeness }: NumberComparisonProfile,
): Quantity[] | null {
  const window = 0.75 - 0.5 * closeness;
  const center = random.next() * (1 - window) + window / 2;
  const items: Quantity[] = [];
  for (let attempt = 0; attempt < 60 && items.length < count; attempt++) {
    const den = randomInt(random, 2, 12);
    const num = randomInt(random, 1, den - 1);
    const fresh = items.every((other) => compareQuantities(other, { label: '', num, den }) !== 0);
    if (gcd(num, den) === 1 && Math.abs(num / den - center) <= window / 2 && fresh)
      items.push({ label: `${num}/${den}`, num, den });
  }
  // Equal denominators make the task a plain integer comparison; require at least two kinds.
  if (items.length < count || new Set(items.map((q) => q.den)).size < 2) return null;
  return items;
}

/** One expression (sum, difference or product) whose value is `value`. */
function expressionFor(random: RandomGenerator, value: number): string {
  const factors = Array.from({ length: 8 }, (_, i) => i + 2).filter(
    (f) => value % f === 0 && value / f >= 2 && value / f <= 12,
  );
  const form = pick(random, [
    'sum',
    'difference',
    ...(factors.length > 0 ? (['product', 'product'] as const) : []),
  ]);
  if (form === 'product') {
    const f = pick(random, factors);
    return `${f} × ${value / f}`;
  }
  if (form === 'sum') {
    const a = randomInt(random, 2, value - 2);
    return `${a} + ${value - a}`;
  }
  const b = randomInt(random, 2, 30);
  return `${value + b} − ${b}`;
}

/** Expressions with close values (e.g. 7 × 8 vs 61 − 4): each must be worked out. */
export function expressions(
  random: RandomGenerator,
  count: number,
  { closeness }: NumberComparisonProfile,
): Quantity[] | null {
  const spread = Math.round(4 + 20 * (1 - closeness));
  const base = randomInt(random, 20, 90);
  const values = new Set<number>();
  while (values.size < count) values.add(base + randomInt(random, 0, spread));
  const items = [...values].map((v) => ({ label: expressionFor(random, v), num: v, den: 1 }));
  return new Set(items.map((q) => q.label)).size === count ? items : null;
}

/** Independent evaluator for expression labels (tests): a op b with + − ×. */
export function evaluateLabel(label: string): number {
  const [a, op, b] = label.split(' ');
  const x = Number(a);
  const y = Number(b);
  if (op === '+') return x + y;
  if (op === '−') return x - y;
  if (op === '×') return x * y;
  if (label.includes('/')) {
    const [n, d] = label.split('/').map(Number);
    return (n as number) / (d as number);
  }
  return Number(label);
}
