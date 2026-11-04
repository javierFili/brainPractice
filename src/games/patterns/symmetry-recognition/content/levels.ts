import { msg } from '@/domain/shared';
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
    objective: msg('patterns:symmetryRecognition.levels.1'),
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
    objective: msg('patterns:symmetryRecognition.levels.2'),
    challengeCount: 5,
    rows: 4,
    cols: 4,
    axes: ['vertical'],
    announceCount: true,
    timing: untimed(20_000),
  },
  {
    ...classify,
    objective: msg('patterns:symmetryRecognition.levels.3'),
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
    objective: msg('patterns:symmetryRecognition.levels.4'),
    challengeCount: 5,
    rows: 5,
    cols: 6,
    axes: ['vertical'],
    announceCount: true,
    timing: untimed(25_000),
  },
  {
    ...classify,
    objective: msg('patterns:symmetryRecognition.levels.5'),
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
    objective: msg('patterns:symmetryRecognition.levels.6'),
    challengeCount: 5,
    rows: 6,
    cols: 5,
    axes: ['horizontal'],
    announceCount: true,
    timing: untimed(28_000),
  },
  {
    ...classify,
    objective: msg('patterns:symmetryRecognition.levels.7'),
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
    objective: msg('patterns:symmetryRecognition.levels.8'),
    challengeCount: 5,
    rows: 6,
    cols: 6,
    axes: ['vertical', 'horizontal'],
    announceCount: false,
    timing: untimed(32_000),
  },
  {
    ...classify,
    objective: msg('patterns:symmetryRecognition.levels.9'),
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
    objective: msg('patterns:symmetryRecognition.levels.10'),
    challengeCount: 5,
    rows: 8,
    cols: 6,
    axes: ['vertical', 'horizontal'],
    announceCount: false,
    timing: untimed(36_000),
  },
]);
