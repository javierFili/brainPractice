import type { RandomGenerator } from './RandomGenerator';

function unit(random: RandomGenerator): number {
  const value = random.next();
  if (!(value >= 0 && value < 1)) {
    throw new RangeError(`RandomGenerator.next() must return a number in [0, 1), got ${value}`);
  }
  return value;
}

/** Uniform integer in [min, max], both inclusive. */
export function randomInt(random: RandomGenerator, min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
    throw new RangeError(`randomInt requires integers min <= max, got [${min}, ${max}]`);
  }
  return min + Math.floor(unit(random) * (max - min + 1));
}

export function chance(random: RandomGenerator, probability: number): boolean {
  if (!(probability >= 0 && probability <= 1)) {
    throw new RangeError(`probability must be in [0, 1], got ${probability}`);
  }
  return unit(random) < probability;
}

export function pick<T>(random: RandomGenerator, items: readonly T[]): T {
  if (items.length === 0) throw new RangeError('pick requires a non-empty array');
  return items[randomInt(random, 0, items.length - 1)] as T;
}

/** Fisher–Yates; returns a new array and never mutates the input. */
export function shuffle<T>(random: RandomGenerator, items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(random, 0, i);
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

/** `count` distinct elements (by position) in random order. */
export function sample<T>(random: RandomGenerator, items: readonly T[], count: number): T[] {
  if (!Number.isInteger(count) || count < 0 || count > items.length) {
    throw new RangeError(`sample count must be an integer in [0, ${items.length}], got ${count}`);
  }
  return shuffle(random, items).slice(0, count);
}
