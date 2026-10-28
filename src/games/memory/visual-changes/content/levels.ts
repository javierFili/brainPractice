import { defineLevels, untimed } from '@/games/kit/content';
import type { VisualChangesProfile } from './types';

const look = (items: number, msPerItem: number) =>
  untimed(items * 800 + 4000, items * msPerItem + 1500);

/**
 * Items grow from 4 to 16 and grids from 3×3 to 6×6. Changes move from colour only, to colour or
 * shape, to look-alike palettes where the new glyph resembles its neighbours, and finally to two
 * items swapping places (nothing new appears: only the arrangement changed).
 */
export const VISUAL_CHANGES_LEVELS = defineLevels<VisualChangesProfile>([
  {
    objective: 'Spot which of 4 shapes changed colour.',
    challengeCount: 5,
    size: 3,
    items: 4,
    palette: 'distinct',
    kinds: { color: 1 },
    timing: look(4, 1000),
  },
  {
    objective: 'Spot a change of colour or shape among 5 items.',
    challengeCount: 5,
    size: 3,
    items: 5,
    palette: 'distinct',
    kinds: { color: 1, shape: 1 },
    timing: look(5, 900),
  },
  {
    objective: 'Spot the change among 6 items on a 4×4 grid.',
    challengeCount: 5,
    size: 4,
    items: 6,
    palette: 'distinct',
    kinds: { color: 1, shape: 1 },
    timing: look(6, 800),
  },
  {
    objective: 'Spot the change among 7 items with a shorter look.',
    challengeCount: 5,
    size: 4,
    items: 7,
    palette: 'distinct',
    kinds: { color: 1, shape: 1 },
    timing: look(7, 650),
  },
  {
    objective: 'Spot the change among 8 look-alike items.',
    challengeCount: 5,
    size: 4,
    items: 8,
    palette: 'similar',
    kinds: { color: 1, shape: 1 },
    timing: look(8, 700),
  },
  {
    objective: 'Spot the change among 9 look-alike items on a 5×5 grid.',
    challengeCount: 5,
    size: 5,
    items: 9,
    palette: 'similar',
    kinds: { color: 1, shape: 1 },
    timing: look(9, 650),
  },
  {
    objective: 'Spot a change or find two items that swapped places.',
    challengeCount: 5,
    size: 5,
    items: 10,
    palette: 'similar',
    kinds: { color: 1, shape: 1, swap: 1 },
    timing: look(10, 600),
  },
  {
    objective: 'Spot changes and swaps among 12 look-alike items.',
    challengeCount: 5,
    size: 5,
    items: 12,
    palette: 'similar',
    kinds: { color: 1, shape: 1, swap: 1 },
    timing: look(12, 550),
  },
  {
    objective: 'Spot changes and swaps among 14 items on a 6×6 grid.',
    challengeCount: 4,
    size: 6,
    items: 14,
    palette: 'similar',
    kinds: { color: 1, shape: 1, swap: 1 },
    timing: look(14, 500),
  },
  {
    objective: 'Spot changes and swaps among 16 look-alike items with a brief look.',
    challengeCount: 4,
    size: 6,
    items: 16,
    palette: 'similar',
    kinds: { color: 1, shape: 1, swap: 2 },
    timing: look(16, 450),
  },
]);
