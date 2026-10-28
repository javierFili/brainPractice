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
    objective: 'Remember where and in what order 3 objects appeared.',
    challengeCount: 5,
    kinds: TWO,
    objects: 3,
    size: 3,
    family: false,
    itemMs: 1600,
    timing: timing(3, 1600),
  },
  {
    objective: 'Remember the place and order of 4 objects.',
    challengeCount: 5,
    kinds: TWO,
    objects: 4,
    size: 3,
    family: false,
    itemMs: 1500,
    timing: timing(4, 1500),
  },
  {
    objective: 'Also say which object sat in a marked cell.',
    challengeCount: 5,
    kinds: THREE,
    objects: 4,
    size: 3,
    family: false,
    itemMs: 1500,
    timing: timing(4, 1500),
  },
  {
    objective: 'Place and order of 5 objects on a 4×4 grid.',
    challengeCount: 5,
    kinds: THREE,
    objects: 5,
    size: 4,
    family: false,
    itemMs: 1400,
    timing: timing(5, 1400),
  },
  {
    objective: 'Add the hardest question: where was the object shown in a given turn?',
    challengeCount: 5,
    kinds: FOUR,
    objects: 5,
    size: 4,
    family: false,
    itemMs: 1400,
    timing: timing(5, 1400),
  },
  {
    objective: 'Six objects of the same family, any question.',
    challengeCount: 5,
    kinds: FOUR,
    objects: 6,
    size: 4,
    family: true,
    itemMs: 1300,
    timing: timing(6, 1300),
  },
  {
    objective: 'Six objects at a quicker pace.',
    challengeCount: 5,
    kinds: FOUR,
    objects: 6,
    size: 4,
    family: true,
    itemMs: 1150,
    timing: timing(6, 1150),
  },
  {
    objective: 'Seven objects of one family on a 4×4 grid.',
    challengeCount: 5,
    kinds: FOUR,
    objects: 7,
    size: 4,
    family: true,
    itemMs: 1100,
    timing: timing(7, 1100),
  },
  {
    objective: 'Seven objects spread over a 5×5 grid.',
    challengeCount: 5,
    kinds: FOUR,
    objects: 7,
    size: 5,
    family: true,
    itemMs: 1050,
    timing: timing(7, 1050),
  },
  {
    objective: 'Eight objects of one family, quickly, on a 5×5 grid.',
    challengeCount: 5,
    kinds: FOUR,
    objects: 8,
    size: 5,
    family: true,
    itemMs: 950,
    timing: timing(8, 950),
  },
]);
