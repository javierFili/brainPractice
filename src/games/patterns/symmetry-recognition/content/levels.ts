import { defineLevels, untimed } from '@/games/kit/content';
import type { SymmetryProfile } from './types';

const ALL = ['left-right', 'top-bottom', 'both', 'none'] as const;
const classify = { kind: 'classify', axes: [], announceCount: false } as const;
const complete = { kind: 'complete', classes: [], breaks: 0, tiles: 1 } as const;

/**
 * Alternates spotting mirror lines and drawing the missing mirror half. Spotting moves from
 * yes/no to four answers, near-symmetric decoys (one or two cells off) and coloured tiles; drawing
 * moves to bigger halves, a horizontal line and no announced count.
 */
export const SYMMETRY_LEVELS = defineLevels<SymmetryProfile>([
  {
    ...classify,
    objective: 'Is the left side a mirror image of the right side?',
    challengeCount: 5,
    rows: 4,
    cols: 4,
    classes: ['left-right', 'none'],
    breaks: 0,
    tiles: 1,
    timing: untimed(10_000),
  },
  {
    ...complete,
    objective: 'Draw the mirror image of a small half.',
    challengeCount: 5,
    rows: 4,
    cols: 4,
    axes: ['vertical'],
    announceCount: true,
    timing: untimed(20_000),
  },
  {
    ...classify,
    objective: 'Find every mirror line: left–right, top–bottom, both or none.',
    challengeCount: 6,
    rows: 5,
    cols: 5,
    classes: ALL,
    breaks: 0,
    tiles: 1,
    timing: untimed(14_000),
  },
  {
    ...complete,
    objective: 'Draw the mirror image of a bigger half.',
    challengeCount: 5,
    rows: 5,
    cols: 6,
    axes: ['vertical'],
    announceCount: true,
    timing: untimed(25_000),
  },
  {
    ...classify,
    objective: 'Spot patterns that are almost symmetric, with two cells out of place.',
    challengeCount: 6,
    rows: 6,
    cols: 6,
    classes: ALL,
    breaks: 2,
    tiles: 1,
    timing: untimed(18_000),
  },
  {
    ...complete,
    objective: 'Mirror across a horizontal line: draw the bottom half.',
    challengeCount: 5,
    rows: 6,
    cols: 5,
    axes: ['horizontal'],
    announceCount: true,
    timing: untimed(28_000),
  },
  {
    ...classify,
    objective: 'Coloured tiles: shapes must mirror too.',
    challengeCount: 6,
    rows: 6,
    cols: 6,
    classes: ALL,
    breaks: 2,
    tiles: 3,
    timing: untimed(20_000),
  },
  {
    ...complete,
    objective: 'Draw the mirror half without being told how many cells.',
    challengeCount: 5,
    rows: 6,
    cols: 6,
    axes: ['vertical', 'horizontal'],
    announceCount: false,
    timing: untimed(32_000),
  },
  {
    ...classify,
    objective: 'Large tile patterns with a single cell out of place.',
    challengeCount: 6,
    rows: 6,
    cols: 6,
    classes: ALL,
    breaks: 1,
    tiles: 4,
    timing: untimed(24_000),
  },
  {
    ...complete,
    objective: 'Large halves, either mirror line, no count given.',
    challengeCount: 5,
    rows: 8,
    cols: 6,
    axes: ['vertical', 'horizontal'],
    announceCount: false,
    timing: untimed(36_000),
  },
]);
