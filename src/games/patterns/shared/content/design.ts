import { randomInt, sample, shuffle, type RandomGenerator } from '@/domain/random';

/**
 * Balanced option designs for attribute-based answers. Option 0 is the answer; every other option
 * differs from it in at least one attribute. Within each attribute, every value used appears in
 * the same number of options, so "pick the value most options share" or "pick the option most
 * similar to the others" gains nothing: every option is equally far from the rest.
 */
export function balancedDesign<T extends object>(
  random: RandomGenerator,
  answer: T,
  /** Wrong values per attribute; attributes left out (or with none) stay as in the answer. */
  alternatives: { readonly [K in keyof T]?: readonly T[K][] },
  count: number,
  key: (option: T) => string,
  attempts = 40,
): T[] | null {
  const attributes = (Object.keys(alternatives) as (keyof T)[]).filter(
    (a) => (alternatives[a]?.length ?? 0) > 0,
  );
  const feasible = attributes.map((attribute) =>
    Array.from({ length: (alternatives[attribute]?.length ?? 0) + 1 }, (_, i) => i + 1).filter(
      (l) => l >= 2 && count % l === 0,
    ),
  );
  // Distinct rows need at least `count` value combinations.
  const best = feasible.reduce((p, ls) => p * Math.max(1, ...ls), 1);
  if (best < count) return null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    let levels = feasible.map((ls) =>
      ls.length === 0 ? 1 : (ls[randomInt(random, 0, ls.length - 1)] as number),
    );
    if (levels.reduce((p, l) => p * l, 1) < count)
      levels = feasible.map((ls) => Math.max(1, ...ls));
    const rows: Record<keyof T, unknown>[] = Array.from({ length: count }, () => ({ ...answer }));
    attributes.forEach((attribute, a) => {
      const level = levels[a] as number;
      if (level < 2) return;
      const alts = alternatives[attribute] ?? [];
      const values = [answer[attribute], ...sample(random, alts, level - 1)];
      const per = count / level;
      const pool = values.flatMap((v) => Array.from({ length: per }, () => v));
      // The answer row keeps the answer value; the others are spread over the remaining rows.
      const rest = shuffle(random, pool.slice(1));
      rows.forEach((row, i) => {
        row[attribute] = i === 0 ? answer[attribute] : rest[i - 1];
      });
    });
    const options = rows as unknown as T[];
    if (new Set(options.map(key)).size === count) return options;
  }
  return null;
}
