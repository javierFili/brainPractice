import { pick, randomInt, sample, shuffle, type RandomGenerator } from '@/domain/random';
import type { CodeMemoryProfile } from '../types';
import { NAME_FAMILIES, type Domain } from '../vocabulary';

export type Similarity = CodeMemoryProfile['records']['similarity'];

const ID_MIN = 100;
const ID_MAX = 999;

const range = (min: number, max: number, step: number) =>
  Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step);

/** Digits of a non-negative integer written in ASCII. */
const digitsOf = (text: string) => Array.from({ length: text.length }, (_, i) => text.charAt(i));

/** All orderings of the digits of `text`. */
function permutations(text: string): string[] {
  if (text.length <= 1) return [text];
  return digitsOf(text).flatMap((char, i) =>
    permutations(text.slice(0, i) + text.slice(i + 1)).map((rest) => char + rest),
  );
}

function idColumn(random: RandomGenerator, count: number, similarity: Similarity): string[] {
  if (similarity === 'high') {
    // Digit permutations of one number (482, 428, 248…): the classic "which one was it?" trap.
    const digits = sample(random, range(1, 9, 1), 3).join('');
    return sample(random, permutations(digits), count);
  }
  const values = new Set<number>();
  while (values.size < count) values.add(randomInt(random, ID_MIN, ID_MAX));
  return [...values].map(String);
}

function intColumn(
  random: RandomGenerator,
  domain: Extract<Domain, { type: 'int' }>,
  count: number,
  similarity: Similarity,
): string[] | null {
  const all = range(domain.min, domain.max, domain.step);
  if (similarity === 'low')
    return all.length < count ? null : sample(random, all, count).map(String);
  // Close values (a few steps apart) interfere with each other.
  const start = randomInt(random, 0, Math.max(0, all.length - count * 2));
  const window = all.slice(start, start + count * 2);
  return window.length < count ? null : sample(random, window, count).map(String);
}

/**
 * `count` values of a domain for one field across several records: distinct for every domain
 * except booleans, so a value identifies its record. Returns null when the domain is too small.
 */
export function column(
  random: RandomGenerator,
  domain: Domain,
  count: number,
  similarity: Similarity,
): string[] | null {
  switch (domain.type) {
    case 'id':
      return idColumn(random, count, similarity);
    case 'name': {
      if (similarity === 'high') return sample(random, pick(random, NAME_FAMILIES), count);
      return sample(random, NAME_FAMILIES, count).map((family) => pick(random, family));
    }
    case 'enum':
      return domain.values.length < count ? null : sample(random, domain.values, count);
    case 'int':
      return intColumn(random, domain, count, similarity);
    case 'bool':
      return Array.from({ length: count }, () =>
        randomInt(random, 0, 1) === 0 ? 'false' : 'true',
      );
  }
}

/** Values a player could plausibly confuse with `value` (never `value` itself). */
export function nearValues(domain: Domain, value: string): string[] {
  const candidates = ((): string[] => {
    switch (domain.type) {
      case 'id': {
        const n = Number(value);
        const offsets = [1, -1, 10, -10, 100, -100].map((d) => n + d);
        const inRange = offsets.filter((v) => v >= ID_MIN && v <= ID_MAX).map(String);
        return [...permutations(value).filter((p) => !p.startsWith('0')), ...inRange];
      }
      case 'name': {
        const family = NAME_FAMILIES.find((f) => f.includes(value)) ?? [];
        return [...family, ...NAME_FAMILIES.flatMap((f) => f.slice(0, 1))];
      }
      case 'enum':
        return [...domain.values];
      case 'int': {
        const n = Number(value);
        const steps = [1, -1, 2, -2, 3, -3].map((k) => n + k * domain.step);
        const reversed = Number(digitsOf(value).reverse().join(''));
        return [...steps, reversed]
          .filter((v) => v >= domain.min && v <= domain.max && (v - domain.min) % domain.step === 0)
          .map(String);
      }
      case 'bool':
        return [value === 'true' ? 'false' : 'true'];
    }
  })();
  return [...new Set(candidates)].filter((candidate) => candidate !== value);
}

/**
 * Near values for the fallback distractors, built so the answer is *not* the hub of the options.
 * Near values of the answer alone make it the one option every other option resembles (a player
 * can pick it without remembering anything). So, except with probability 1 / optionCount, the
 * near values are built around a decoy anchor instead, and the answer is just one of its
 * neighbours. The anchor comes first so it is always among the options when fallback is used.
 */
export function anchoredNear<T>(
  random: RandomGenerator,
  correct: T,
  nearOf: (value: T) => readonly T[],
  optionCount: number,
): T[] {
  const near = nearOf(correct);
  if (near.length === 0 || randomInt(random, 0, optionCount - 1) === 0)
    return shuffle(random, near);
  const anchor = pick(random, near);
  return [
    anchor,
    ...shuffle(
      random,
      nearOf(anchor).filter((value) => value !== correct),
    ),
  ];
}

/**
 * Up to `count` distinct wrong options: `preferred` first, shuffled (interference from what the
 * player actually saw), then `fallback` in the given order (see `anchoredNear`). Null if too few.
 */
export function pickDistractors(
  random: RandomGenerator,
  correct: string,
  preferred: readonly string[],
  fallback: readonly string[],
  count: number,
): string[] | null {
  const ordered = [...shuffle(random, preferred), ...fallback];
  const distinct = [...new Set(ordered)].filter((value) => value !== correct);
  return distinct.length < count ? null : distinct.slice(0, count);
}
