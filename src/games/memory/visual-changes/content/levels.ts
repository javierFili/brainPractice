import { msg } from '@/domain/shared';
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
    objective: msg('memory:visualChanges.levels.1'),
    challengeCount: 5,
    size: 3,
    items: 4,
    palette: 'distinct',
    kinds: { color: 1 },
    timing: look(4, 1000),
  },
  {
    objective: msg('memory:visualChanges.levels.2'),
    challengeCount: 5,
    size: 3,
    items: 5,
    palette: 'distinct',
    kinds: { color: 1, shape: 1 },
    timing: look(5, 900),
  },
  {
    objective: msg('memory:visualChanges.levels.3'),
    challengeCount: 5,
    size: 4,
    items: 6,
    palette: 'distinct',
    kinds: { color: 1, shape: 1 },
    timing: look(6, 800),
  },
  {
    objective: msg('memory:visualChanges.levels.4'),
    challengeCount: 5,
    size: 4,
    items: 7,
    palette: 'distinct',
    kinds: { color: 1, shape: 1 },
    timing: look(7, 650),
  },
  {
    objective: msg('memory:visualChanges.levels.5'),
    challengeCount: 5,
    size: 4,
    items: 8,
    palette: 'similar',
    kinds: { color: 1, shape: 1 },
    timing: look(8, 700),
  },
  {
    objective: msg('memory:visualChanges.levels.6'),
    challengeCount: 5,
    size: 5,
    items: 9,
    palette: 'similar',
    kinds: { color: 1, shape: 1 },
    timing: look(9, 650),
  },
  {
    objective: msg('memory:visualChanges.levels.7'),
    challengeCount: 5,
    size: 5,
    items: 10,
    palette: 'similar',
    kinds: { color: 1, shape: 1, swap: 1 },
    timing: look(10, 600),
  },
  {
    objective: msg('memory:visualChanges.levels.8'),
    challengeCount: 5,
    size: 5,
    items: 12,
    palette: 'similar',
    kinds: { color: 1, shape: 1, swap: 1 },
    timing: look(12, 550),
  },
  {
    objective: msg('memory:visualChanges.levels.9'),
    challengeCount: 4,
    size: 6,
    items: 14,
    palette: 'similar',
    kinds: { color: 1, shape: 1, swap: 1 },
    timing: look(14, 500),
  },
  {
    objective: msg('memory:visualChanges.levels.10'),
    challengeCount: 4,
    size: 6,
    items: 16,
    palette: 'similar',
    kinds: { color: 1, shape: 1, swap: 2 },
    timing: look(16, 450),
  },
]);
