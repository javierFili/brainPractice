import { sample, type RandomGenerator } from '@/domain/random';
import { msg, type Message } from '@/domain/shared';

/**
 * Concrete, short, high-frequency nouns, grouped by theme. Familiar words keep word tasks about
 * memory rather than vocabulary. Every word is unique across groups. The English word is the
 * word's id; `wordLabel` is what people read, translated (and unique) in every language.
 */
export const WORD_GROUPS = {
  home: ['chair', 'table', 'lamp', 'door', 'window', 'bed', 'clock', 'mirror', 'sofa', 'shelf'],
  kitchen: ['spoon', 'fork', 'plate', 'cup', 'bowl', 'knife', 'oven', 'kettle', 'pan', 'jar'],
  nature: [
    'river',
    'mountain',
    'forest',
    'cloud',
    'stone',
    'leaf',
    'beach',
    'island',
    'lake',
    'hill',
  ],
  animals: ['horse', 'rabbit', 'tiger', 'mouse', 'eagle', 'whale', 'snake', 'sheep', 'owl', 'frog'],
  city: [
    'bridge',
    'tower',
    'street',
    'market',
    'school',
    'garden',
    'museum',
    'station',
    'park',
    'library',
  ],
  objects: [
    'basket',
    'candle',
    'ladder',
    'pillow',
    'button',
    'wallet',
    'ticket',
    'helmet',
    'bottle',
    'rope',
  ],
  food: ['bread', 'apple', 'cheese', 'soup', 'rice', 'honey', 'lemon', 'onion', 'butter', 'salad'],
  music: ['drum', 'piano', 'guitar', 'violin', 'flute', 'trumpet', 'bell', 'harp', 'song', 'choir'],
} as const;

export type WordGroup = keyof typeof WORD_GROUPS;

export const ALL_WORDS: readonly string[] = Object.values(WORD_GROUPS).flat();

export const groupOf = (word: string): WordGroup | undefined =>
  (Object.keys(WORD_GROUPS) as WordGroup[]).find((group) =>
    (WORD_GROUPS[group] as readonly string[]).includes(word),
  );

export const wordLabel = (word: string): Message => msg(`kit:words.${word}`);

/** Theme name, e.g. "kitchen" → "cocina". */
export const wordGroupLabel = (group: WordGroup): Message => msg(`kit:wordGroups.${group}`);

export const sampleWords = (random: RandomGenerator, count: number) =>
  sample(random, ALL_WORDS, count);
