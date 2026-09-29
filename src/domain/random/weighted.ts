import type { RandomGenerator } from './RandomGenerator';

/** Picks a key with probability proportional to its (positive) weight. */
export function weightedPick<K extends string>(
  random: RandomGenerator,
  weights: Readonly<Partial<Record<K, number>>>,
): K {
  const entries = (Object.entries(weights) as [K, number | undefined][]).filter(
    (entry): entry is [K, number] => entry[1] !== undefined && entry[1] > 0,
  );
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (entries.length === 0 || !Number.isFinite(total))
    throw new RangeError('weightedPick needs at least one positive weight');
  const value = random.next();
  if (!(value >= 0 && value < 1))
    throw new RangeError(`RandomGenerator.next() must return a number in [0, 1), got ${value}`);
  let threshold = value * total;
  for (const [key, weight] of entries) {
    threshold -= weight;
    if (threshold < 0) return key;
  }
  return (entries.at(-1) as [K, number])[0];
}
