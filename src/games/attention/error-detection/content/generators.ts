import { chance, pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import { msg, type Message } from '@/domain/shared';
import { ALL_WORDS, distinctInts, objectsOf } from '@/games/kit/content';
import { clock, moneyText } from './format';
import { LEXICON, compareIn, inLanguages, isKnownWord, localize, spell } from './lexicon';
import { findErrors } from './solve';
import type { ErrorDetectionContent, ErrorDetectionProfile, ErrorKind } from './types';

export interface ErrorDraft {
  readonly content: ErrorDetectionContent;
  readonly explanation: Message;
}

const explain = (key: string, values: Parameters<typeof msg>[1]) =>
  msg(`attention:errorDetection.explanation.${key}`, values);

/** Moves the item at `from` to `to`. */
function displaced<T>(base: readonly T[], from: number, to: number): T[] {
  const values = [...base];
  const [moved] = values.splice(from, 1);
  values.splice(to, 0, moved as T);
  return values;
}

type Generator = (random: RandomGenerator, profile: ErrorDetectionProfile) => ErrorDraft | null;

function sorted(
  random: RandomGenerator,
  { items, subtle }: ErrorDetectionProfile,
): ErrorDraft | null {
  const useWords = subtle && chance(random, 0.5);
  const ids = useWords ? sample(random, ALL_WORDS, items) : [];
  const numbers = useWords
    ? []
    : distinctInts(random, items, subtle ? 100 : 1, subtle ? 999 : 60).sort((a, b) => a - b);
  const from = randomInt(random, 0, items - 1);
  const to = randomInt(random, 0, items - 1);
  if (Math.abs(from - to) < (subtle ? 2 : 3)) return null;
  if (!useWords) {
    return {
      content: { kind: 'sorted', values: displaced(numbers, from, to), words: null },
      explanation: explain('sorted', { value: String(numbers[from]) }),
    };
  }
  // Each language sorts the same words its own way; the same move puts one word out of place
  // on the same row in every language.
  const base = localize((language) =>
    ids.map((id) => spell(id, language)).sort((a, b) => compareIn(language, a, b)),
  );
  return {
    content: {
      kind: 'sorted',
      values: [],
      words: localize((language) => displaced(base[language], from, to)),
    },
    explanation: explain('sorted', {
      value: inLanguages(localize((language) => base[language][from] as string)),
    }),
  };
}

const PRODUCTS = [...objectsOf('fruit'), ...objectsOf('food')].map((o) => o.name);

function receipt(random: RandomGenerator, profile: ErrorDetectionProfile): ErrorDraft | null {
  const lineCount = profile.withTotal ? profile.items - 1 : profile.items;
  const lines = sample(random, PRODUCTS, lineCount).map((item) => {
    const quantity = randomInt(random, 1, profile.subtle ? 6 : 4);
    const priceCents = randomInt(random, 2, profile.subtle ? 99 : 20) * (profile.subtle ? 5 : 25);
    return { item, quantity, priceCents, totalCents: quantity * priceCents };
  });
  const errorAtTotal = profile.withTotal && chance(random, 1 / (lineCount + 1));
  const delta =
    (profile.subtle ? pick(random, [10, 20, 50]) : pick(random, [100, 200, 300])) *
    (chance(random, 0.5) ? 1 : -1);
  if (errorAtTotal) {
    const sum = lines.reduce((s, l) => s + l.totalCents, 0);
    if (sum + delta <= 0) return null;
    return {
      content: { kind: 'receipt', lines, totalCents: sum + delta },
      explanation: explain('total', { sum: moneyText(sum), total: moneyText(sum + delta) }),
    };
  }
  const at = randomInt(random, 0, lineCount - 1);
  const line = lines[at] as (typeof lines)[number];
  if (line.totalCents + delta <= 0) return null;
  const wrong = { ...line, totalCents: line.totalCents + delta };
  const printed = lines.map((l, i) => (i === at ? wrong : l));
  return {
    content: {
      kind: 'receipt',
      lines: printed,
      totalCents: profile.withTotal ? printed.reduce((s, l) => s + l.totalCents, 0) : null,
    },
    explanation: explain('line', {
      quantity: String(line.quantity),
      price: moneyText(line.priceCents),
      right: moneyText(line.totalCents),
      wrong: moneyText(wrong.totalCents),
    }),
  };
}

/** Activity ids (`attention:errorDetection.activity.<id>`). */
const ACTIVITIES = [
  'reading',
  'maths',
  'lunch',
  'music',
  'walk',
  'art',
  'break',
  'science',
  'meeting',
  'emails',
  'gym',
  'cooking',
  'phoneCall',
  'shopping',
];

function schedule(
  random: RandomGenerator,
  { items, subtle }: ErrorDetectionProfile,
): ErrorDraft | null {
  let at = randomInt(random, 7, 10) * 60 + pick(random, [0, 15, 30]);
  const events = sample(random, ACTIVITIES, items).map((activity) => {
    const minutes = pick(random, subtle ? [20, 25, 30, 35, 40, 45, 50] : [15, 30, 45, 60]);
    const start = at + (chance(random, 0.3) ? pick(random, [0, 5, 10]) : 0);
    at = start + minutes;
    return { activity, start, end: start + minutes, minutes };
  });
  const index = randomInt(random, 0, items - 1);
  const event = events[index] as (typeof events)[number];
  const stated =
    event.minutes + (subtle ? pick(random, [-10, -5, 5, 10]) : pick(random, [-15, 15, 30]));
  if (stated <= 0) return null;
  events[index] = { ...event, minutes: stated };
  return {
    content: { kind: 'schedule', events },
    explanation: explain('schedule', {
      start: clock(event.start),
      end: clock(event.end),
      count: event.minutes,
      stated,
    }),
  };
}

const VOWELS = ['a', 'e', 'i', 'o', 'u'];

interface Typo {
  /** Uniform draw choosing the letter position (scaled to each word's length). */
  readonly at: number;
  readonly kind: number;
  /** Index among the four other vowels, for a changed vowel. */
  readonly vowel: number;
}

/** One small typo: swapped neighbours, doubled or dropped letter, or a changed vowel. */
function misspell(word: string, { at, kind, vowel: choice }: Typo): string {
  const i = 1 + Math.floor(at * Math.max(1, word.length - 2));
  switch (kind) {
    case 0:
      return word.slice(0, i) + (word[i + 1] ?? '') + (word[i] ?? '') + word.slice(i + 2);
    case 1:
      return word.slice(0, i) + (word[i] ?? '') + word.slice(i);
    case 2:
      return word.slice(0, i) + word.slice(i + 1);
    default: {
      const vowel = Array.from(word).findIndex((c, k) => k > 0 && VOWELS.includes(c));
      if (vowel === -1) return word;
      const replacement = VOWELS.filter((v) => v !== word[vowel])[choice] as string;
      return word.slice(0, vowel) + replacement + word.slice(vowel + 1);
    }
  }
}

/** Words long enough (in every language) for a typo inside them. */
const SPELLING_WORDS = ALL_WORDS.filter((id) =>
  Object.values(LEXICON[id] ?? {}).every((word) => word.length >= 4),
);

function spelling(random: RandomGenerator, { items }: ErrorDetectionProfile): ErrorDraft | null {
  const ids = sample(random, SPELLING_WORDS, items);
  const index = randomInt(random, 0, items - 1);
  // One set of draws describes the typo; it is applied to the word in every language.
  const at = random.next();
  const kind = randomInt(random, 0, 3);
  const typo: Typo = { at, kind, vowel: kind === 3 ? randomInt(random, 0, 3) : 0 };
  const right = localize((language) => spell(ids[index] as string, language));
  const wrong = localize((language) => misspell(right[language], typo));
  for (const [language, word] of Object.entries(wrong) as [keyof typeof wrong, string][]) {
    if (word === right[language] || isKnownWord(word, language) || word.length < 3) return null;
  }
  return {
    content: {
      kind: 'spelling',
      words: localize((language) =>
        ids.map((id, i) => (i === index ? wrong[language] : spell(id, language))),
      ),
    },
    explanation: explain('spelling', { wrong: inLanguages(wrong), right: inLanguages(right) }),
  };
}

const LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const DIGITS = '0123456789';
const LOOKALIKE: Readonly<Record<string, string>> = {
  '0': 'O',
  O: '0',
  '1': 'I',
  I: '1',
  '5': 'S',
  S: '5',
  '8': 'B',
  B: '8',
  '2': 'Z',
  Z: '2',
  '6': 'G',
  G: '6',
  E: 'F',
  F: 'E',
  M: 'N',
  N: 'M',
  '3': '8',
  '7': '1',
};

function code(random: RandomGenerator, subtle: boolean): string {
  const letters = Array.from({ length: subtle ? 3 : 2 }, () => pick(random, Array.from(LETTERS)));
  const digits = Array.from({ length: subtle ? 5 : 4 }, () => pick(random, Array.from(DIGITS)));
  return `${letters.join('')}-${digits.join('')}`;
}

function copy(
  random: RandomGenerator,
  { items, subtle }: ErrorDetectionProfile,
): ErrorDraft | null {
  const originals = Array.from({ length: items }, () => code(random, subtle));
  if (new Set(originals).size !== items) return null;
  const index = randomInt(random, 0, items - 1);
  const original = originals[index] as string;
  const positions = Array.from(original).flatMap((c, i) => (c === '-' ? [] : [i]));
  const candidates = subtle
    ? positions.filter((i) => LOOKALIKE[original[i] ?? ''] !== undefined)
    : positions;
  if (candidates.length === 0) return null;
  const at = pick(random, candidates);
  const char = original[at] as string;
  const replacement = subtle
    ? (LOOKALIKE[char] as string)
    : pick(
        random,
        Array.from(DIGITS.includes(char) ? DIGITS : LETTERS).filter((c) => c !== char),
      );
  const wrong = original.slice(0, at) + replacement + original.slice(at + 1);
  return {
    content: {
      kind: 'copy',
      pairs: originals.map((o, i) => ({ original: o, copy: i === index ? wrong : o })),
    },
    explanation: explain('copy', {
      wrong,
      original,
      position: at + 1,
      replacement,
      char,
    }),
  };
}

export const GENERATORS: Record<ErrorKind, Generator> = {
  sorted,
  receipt,
  schedule,
  spelling,
  copy,
};

/** Keeps a draft only when the solver finds exactly one error. */
export function withSingleError(draft: ErrorDraft | null): (ErrorDraft & { index: number }) | null {
  if (draft === null) return null;
  const errors = findErrors(draft.content);
  return errors.length === 1 ? { ...draft, index: errors[0] as number } : null;
}
