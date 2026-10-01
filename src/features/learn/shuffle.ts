import { mulberry32, shuffle, toSeed } from '@/domain/random';

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Same order every time for the same key, and never the original order (when it can differ). */
export function stableShuffle<T>(items: readonly T[], key: string): T[] {
  if (items.length < 2) return [...items];
  const shuffled = shuffle(mulberry32(toSeed(hash(key))), items);
  return shuffled.every((item, i) => item === items[i])
    ? [...items.slice(1), items[0] as T]
    : shuffled;
}
