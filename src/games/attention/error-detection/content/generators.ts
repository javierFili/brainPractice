import { chance, pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import { ALL_WORDS, distinctInts, objectsOf } from '@/games/kit/content';
import { clock, money } from './format';
import { findErrors, isKnownWord } from './solve';
import type { ErrorDetectionContent, ErrorDetectionProfile, ErrorKind } from './types';

export interface ErrorDraft {
  readonly content: ErrorDetectionContent;
  readonly explanation: string;
}

type Generator = (random: RandomGenerator, profile: ErrorDetectionProfile) => ErrorDraft | null;

function sorted(
  random: RandomGenerator,
  { items, subtle }: ErrorDetectionProfile,
): ErrorDraft | null {
  const words = subtle && chance(random, 0.5);
  const base: (number | string)[] = words
    ? sample(random, ALL_WORDS, items).sort()
    : distinctInts(random, items, subtle ? 100 : 1, subtle ? 999 : 60).sort((a, b) => a - b);
  const from = randomInt(random, 0, items - 1);
  const to = randomInt(random, 0, items - 1);
  if (Math.abs(from - to) < (subtle ? 2 : 3)) return null;
  const values = [...base];
  const [moved] = values.splice(from, 1);
  values.splice(to, 0, moved as number | string);
  return {
    content: { kind: 'sorted', values },
    explanation: `${String(moved)} is out of place: without it, the list is in order.`,
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
      explanation: `The lines add up to ${money(sum)}, but TOTAL says ${money(sum + delta)}.`,
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
    explanation: `${line.quantity} × ${money(line.priceCents)} = ${money(line.totalCents)}, not ${money(wrong.totalCents)}.`,
  };
}

const ACTIVITIES = [
  'Reading',
  'Maths',
  'Lunch',
  'Music',
  'Walk',
  'Art',
  'Break',
  'Science',
  'Meeting',
  'Emails',
  'Gym',
  'Cooking',
  'Phone call',
  'Shopping',
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
    explanation: `${clock(event.start)}–${clock(event.end)} is ${event.minutes} minutes, not ${stated}.`,
  };
}

const VOWELS = ['a', 'e', 'i', 'o', 'u'];

/** One small typo: swapped neighbours, doubled or dropped letter, or a changed vowel. */
function misspell(random: RandomGenerator, word: string): string {
  const i = randomInt(random, 1, word.length - 2);
  switch (randomInt(random, 0, 3)) {
    case 0:
      return word.slice(0, i) + (word[i + 1] ?? '') + (word[i] ?? '') + word.slice(i + 2);
    case 1:
      return word.slice(0, i) + (word[i] ?? '') + word.slice(i);
    case 2:
      return word.slice(0, i) + word.slice(i + 1);
    default: {
      const vowel = Array.from(word).findIndex((c, k) => k > 0 && VOWELS.includes(c));
      if (vowel === -1) return word;
      const replacement = pick(
        random,
        VOWELS.filter((v) => v !== word[vowel]),
      );
      return word.slice(0, vowel) + replacement + word.slice(vowel + 1);
    }
  }
}

function spelling(random: RandomGenerator, { items }: ErrorDetectionProfile): ErrorDraft | null {
  const words = sample(
    random,
    ALL_WORDS.filter((w) => w.length >= 4),
    items,
  );
  const index = randomInt(random, 0, items - 1);
  const right = words[index] as string;
  const wrong = misspell(random, right);
  if (wrong === right || isKnownWord(wrong) || wrong.length < 3) return null;
  words[index] = wrong;
  return {
    content: { kind: 'spelling', words },
    explanation: `“${wrong}” should be spelt “${right}”.`,
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
    explanation: `${wrong} is not ${original}: character ${at + 1} is “${replacement}” instead of “${char}”.`,
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
