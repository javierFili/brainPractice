import { randomInt, shuffle, type RandomGenerator } from '@/domain/random';

/**
 * Numeric options in which the answer's rank is uniformly random, so neither "pick the middle"
 * nor "pick an extreme" beats chance. Options are spaced `step` apart around the answer, each
 * pushed further out by a random extra in [0, jitter] (jitter < step keeps them distinct), then
 * shuffled.
 * With a finite `min`, the answer's rank is capped so every option stays ≥ min.
 */
export function rankedNumericOptions(
  random: RandomGenerator,
  correct: number,
  count: number,
  { step = 1, min = Number.NEGATIVE_INFINITY, jitter = 0 } = {},
): number[] {
  if (!Number.isInteger(count) || count < 2) throw new RangeError('count must be >= 2');
  if (correct < min) throw new RangeError('correct is below min');
  if (!(step > 0) || jitter < 0 || jitter >= step) throw new RangeError('need 0 <= jitter < step');
  const room = Number.isFinite(min) ? Math.floor((correct - min) / (step + jitter)) : count - 1;
  const rank = randomInt(random, 0, Math.min(count - 1, room));
  const values = Array.from({ length: count }, (_, i) => {
    if (i === rank) return correct;
    const extra = jitter > 0 ? randomInt(random, 0, jitter) : 0;
    const distance = Math.abs(i - rank) * step + extra;
    return i > rank ? correct + distance : correct - distance;
  });
  return shuffle(random, values);
}

/** `count` distinct integers in [min, max]. */
export function distinctInts(random: RandomGenerator, count: number, min: number, max: number) {
  if (max - min + 1 < count) throw new RangeError('Range too small for distinct integers');
  const picked = new Set<number>();
  while (picked.size < count) picked.add(randomInt(random, min, max));
  return [...picked];
}
