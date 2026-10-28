import { pick, randomInt, type RandomGenerator } from '@/domain/random';
import type { SequenceChange } from './types';

/** One change: two neighbours swapped, or one symbol replaced by an unused one from `pool`. */
export function changeOnce(
  random: RandomGenerator,
  items: readonly string[],
  pool: readonly string[],
  changes: readonly SequenceChange[],
): string[] {
  const out = [...items];
  if (pick(random, changes) === 'swap') {
    const i = randomInt(random, 0, out.length - 2);
    [out[i], out[i + 1]] = [out[i + 1] as string, out[i] as string];
  } else {
    const unused = pool.filter((s) => !out.includes(s));
    out[randomInt(random, 0, out.length - 1)] = pick(random, unused);
  }
  return out;
}

const keyOf = (items: readonly string[]) => items.join('|');

/**
 * `count` distinct sequences including `target`, laid out so that neither "pick the sequence the
 * others resemble most" nor "pick the odd one out" beats chance. All options are one change away
 * from a hidden centre: with probability 1/count the centre is the target itself, otherwise it is
 * a decoy one change away from the target (and the target is one of its neighbours). Either way
 * the target sits in each structural role exactly as often as chance predicts.
 * Returns null when not enough distinct sequences were found.
 */
export function recognitionOptions(
  random: RandomGenerator,
  target: readonly string[],
  count: number,
  pool: readonly string[],
  changes: readonly SequenceChange[],
): string[][] | null {
  const centreIsTarget = randomInt(random, 0, count - 1) === 0;
  const centre = centreIsTarget ? [...target] : changeOnce(random, target, pool, changes);
  const options = new Map<string, string[]>([[keyOf(target), [...target]]]);
  if (!centreIsTarget) options.set(keyOf(centre), centre);
  for (let attempt = 0; attempt < 40 && options.size < count; attempt++) {
    const candidate = changeOnce(random, centre, pool, changes);
    options.set(keyOf(candidate), candidate);
  }
  return options.size === count ? [...options.values()] : null;
}
