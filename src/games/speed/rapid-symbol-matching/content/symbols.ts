import { pick, randomInt, type RandomGenerator } from '@/domain/random';
import { joinText, msg, type Text } from '@/domain/shared';
import type { Mutation, SymbolPool } from './types';

/** Each pool is a list of groups; a substitution stays inside its symbol's group. */
const POOLS: Record<SymbolPool, readonly (readonly string[])[]> = {
  letters: [['A', 'H', 'K', 'M', 'R', 'T', 'W', 'X', 'Z', 'Y']],
  shapes: [['▲', '■', '●', '◆', '★', '♥', '▼']],
  confusable: [
    ['b', 'd', 'p', 'q'],
    ['O', 'Q', 'C', 'G'],
    ['E', 'F'],
    ['M', 'N', 'W'],
    ['5', 'S'],
    ['8', 'B'],
  ],
};

const SYMBOL_NAMES: Readonly<Record<string, string>> = {
  '▲': 'upTriangle',
  '■': 'square',
  '●': 'circle',
  '◆': 'diamond',
  '★': 'star',
  '♥': 'heart',
  '▼': 'downTriangle',
};

/** The symbols of a string (every symbol here is a single code point). */
export const symbolsOf = (text: string): string[] => Array.from(text);

/** Spoken form: symbols by name, letters spelled with their case ("small b", "capital Q"). */
export function spokenString(text: string): Text {
  return joinText(
    symbolsOf(text).map((ch): Text => {
      const name = SYMBOL_NAMES[ch];
      if (name !== undefined) return msg(`speed:rapidSymbolMatching.spoken.${name}`);
      if (/[a-z]/.test(ch)) return msg('speed:rapidSymbolMatching.spoken.small', { letter: ch });
      if (/[A-Z]/.test(ch)) return msg('speed:rapidSymbolMatching.spoken.capital', { letter: ch });
      return ch;
    }),
    ', ',
  );
}

export const poolSymbols = (pool: SymbolPool): readonly string[] => POOLS[pool].flat();

const ANY_SYMBOL: ReadonlySet<string> = new Set(Object.values(POOLS).flat(2));

/** True for a candidate string made only of game symbols (not a translated word like "Same"). */
export const isSymbolString = (text: string): boolean =>
  text.length > 0 && symbolsOf(text).every((ch) => ANY_SYMBOL.has(ch));

const groupOf = (pool: SymbolPool, ch: string) =>
  POOLS[pool].find((group) => group.includes(ch)) ?? [];

/** A random string with no symbol twice in a row (a repeat would make swaps invisible). */
export function randomString(random: RandomGenerator, pool: SymbolPool, length: number): string {
  const symbols = poolSymbols(pool);
  const out: string[] = [];
  while (out.length < length) {
    const previous = out.at(-1);
    out.push(
      pick(
        random,
        symbols.filter((s) => s !== previous && groupOf(pool, s).length > 1),
      ),
    );
  }
  return out.join('');
}

/** Applies one mutation; returns null when it cannot change the string. */
export function mutate(
  random: RandomGenerator,
  pool: SymbolPool,
  text: string,
  mutation: Mutation,
): string | null {
  const chars = symbolsOf(text);
  if (mutation === 'transpose') {
    const i = randomInt(random, 0, chars.length - 2);
    const [a, b] = [chars[i] as string, chars[i + 1] as string];
    if (a === b) return null;
    chars[i] = b;
    chars[i + 1] = a;
  } else {
    const i = randomInt(random, 0, chars.length - 1);
    const current = chars[i] as string;
    const choices = groupOf(pool, current).filter(
      (s) => s !== current && s !== chars[i - 1] && s !== chars[i + 1],
    );
    if (choices.length === 0) return null;
    chars[i] = pick(random, choices);
  }
  const result = chars.join('');
  return result === text ? null : result;
}

/** Number of positions where two equal-length strings differ. */
export const differences = (a: string, b: string) => {
  const x = symbolsOf(a);
  const y = symbolsOf(b);
  return x.filter((ch, i) => ch !== y[i]).length;
};
