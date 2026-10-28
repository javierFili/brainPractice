import { defineLevels, untimed } from '@/games/kit/content';
import type { WordRecallProfile, WordRecallVariant } from './types';

const recognise = (words: number, maxErrors = 0): WordRecallVariant => ({
  kind: 'recognise',
  words,
  board: words * 2,
  themes: 0,
  maxErrors,
});
const similar = (words: number, board: number, themes: number, maxErrors: number) =>
  ({ kind: 'similar', words, board, themes, maxErrors }) as const;
const order = (words: number): WordRecallVariant => ({
  kind: 'order',
  words,
  board: 0,
  themes: 0,
  maxErrors: 0,
});

/** Study lasts as long as the presentation of the longest list, plus a moment. */
const timing = (words: number, itemMs: number) =>
  untimed(words * 2000 + 4000, words * itemMs + 1000);

/**
 * Lists grow from 4 to 10 words shown one at a time, a little faster each level. From level 4 the
 * new words share themes with the studied ones; from level 6 a small tolerance replaces
 * exact-count marking on long lists; from level 7 some lists must be put back in order.
 */
export const WORD_RECALL_LEVELS = defineLevels<WordRecallProfile>([
  {
    objective: 'Recognise 4 words among 8.',
    challengeCount: 4,
    variants: [recognise(4)],
    itemMs: 1500,
    timing: timing(4, 1500),
  },
  {
    objective: 'Recognise 5 words among 10.',
    challengeCount: 4,
    variants: [recognise(5)],
    itemMs: 1400,
    timing: timing(5, 1400),
  },
  {
    objective: 'Recognise 6 words among 12.',
    challengeCount: 4,
    variants: [recognise(6)],
    itemMs: 1300,
    timing: timing(6, 1300),
  },
  {
    objective: 'Recognise 6 words when the new ones share their theme.',
    challengeCount: 4,
    variants: [similar(6, 12, 2, 0)],
    itemMs: 1300,
    timing: timing(6, 1300),
  },
  {
    objective: 'Recognise 7 words among 14 of the same themes.',
    challengeCount: 4,
    variants: [similar(7, 14, 2, 0)],
    itemMs: 1200,
    timing: timing(7, 1200),
  },
  {
    objective: 'Mark the 8 words you saw among 16 (one slip allowed).',
    challengeCount: 4,
    variants: [similar(8, 16, 2, 1)],
    itemMs: 1200,
    timing: timing(8, 1200),
  },
  {
    objective: 'Recognise 8 words, or put 5 words back in order.',
    challengeCount: 4,
    variants: [similar(8, 16, 2, 1), order(5)],
    itemMs: 1150,
    timing: timing(8, 1150),
  },
  {
    objective: 'Recognise 9 words among 16, or order 6 words.',
    challengeCount: 4,
    variants: [similar(9, 16, 2, 1), order(6)],
    itemMs: 1100,
    timing: timing(9, 1100),
  },
  {
    objective: 'Recognise 10 words among 18, or order 6 words.',
    challengeCount: 4,
    variants: [similar(10, 18, 2, 1), order(6)],
    itemMs: 1050,
    timing: timing(10, 1050),
  },
  {
    objective: 'Recognise 10 words among 20 from three themes, or order 7 words.',
    challengeCount: 4,
    variants: [similar(10, 20, 3, 1), order(7)],
    itemMs: 1000,
    timing: timing(10, 1000),
  },
]);
