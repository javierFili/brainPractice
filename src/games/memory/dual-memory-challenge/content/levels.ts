import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { DualMemoryProfile } from './types';

const timing = (objects: number, itemMs: number) => untimed(9000, objects * itemMs + 1000);

const TWO = { where: 1, 'which-nth': 1 } as const;
const THREE = { where: 1, 'which-nth': 1, 'which-here': 1 } as const;
const FOUR = { where: 1, 'which-nth': 1, 'which-here': 1, 'where-nth': 1 } as const;

/**
 * Objects appear one at a time, each in its own cell, so both place and order have to be kept.
 * Levels add objects (3 → 8) and cells, then new kinds of question (which object sat in a cell;
 * where the n-th object was), then objects of a single family and a faster pace.
 */
export const DUAL_MEMORY_LEVELS = defineLevels<DualMemoryProfile>([
  {
    objective: msg('memory:dualMemoryChallenge.levels.1'),
    challengeCount: 5,
    kinds: TWO,
    objects: 3,
    size: 3,
    family: false,
    itemMs: 1600,
    timing: timing(3, 1600),
  },
  {
    objective: msg('memory:dualMemoryChallenge.levels.2'),
    challengeCount: 5,
    kinds: TWO,
    objects: 4,
    size: 3,
    family: false,
    itemMs: 1500,
    timing: timing(4, 1500),
  },
  {
    objective: msg('memory:dualMemoryChallenge.levels.3'),
    challengeCount: 5,
    kinds: THREE,
    objects: 4,
    size: 3,
    family: false,
    itemMs: 1500,
    timing: timing(4, 1500),
  },
  {
    objective: msg('memory:dualMemoryChallenge.levels.4'),
    challengeCount: 5,
    kinds: THREE,
    objects: 5,
    size: 4,
    family: false,
    itemMs: 1400,
    timing: timing(5, 1400),
  },
  {
    objective: msg('memory:dualMemoryChallenge.levels.5'),
    challengeCount: 5,
    kinds: FOUR,
    objects: 5,
    size: 4,
    family: false,
    itemMs: 1400,
    timing: timing(5, 1400),
  },
  {
    objective: msg('memory:dualMemoryChallenge.levels.6'),
    challengeCount: 5,
    kinds: FOUR,
    objects: 6,
    size: 4,
    family: true,
    itemMs: 1300,
    timing: timing(6, 1300),
  },
  {
    objective: msg('memory:dualMemoryChallenge.levels.7'),
    challengeCount: 5,
    kinds: FOUR,
    objects: 6,
    size: 4,
    family: true,
    itemMs: 1150,
    timing: timing(6, 1150),
  },
  {
    objective: msg('memory:dualMemoryChallenge.levels.8'),
    challengeCount: 5,
    kinds: FOUR,
    objects: 7,
    size: 4,
    family: true,
    itemMs: 1100,
    timing: timing(7, 1100),
  },
  {
    objective: msg('memory:dualMemoryChallenge.levels.9'),
    challengeCount: 5,
    kinds: FOUR,
    objects: 7,
    size: 5,
    family: true,
    itemMs: 1050,
    timing: timing(7, 1050),
  },
  {
    objective: msg('memory:dualMemoryChallenge.levels.10'),
    challengeCount: 5,
    kinds: FOUR,
    objects: 8,
    size: 5,
    family: true,
    itemMs: 950,
    timing: timing(8, 950),
  },
]);
