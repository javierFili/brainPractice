import { defineLevels, untimed } from '@/games/kit/content';
import type { ObjectRecallProfile } from './types';

const look = (studied: number, msPerObject: number) =>
  untimed(studied * 2500 + 3000, studied * msPerObject + 1000);

/**
 * The study set grows from 3 to 10 objects and the board from 6 to 20, while study time per object
 * shrinks. From level 4, new objects come from the same families as the studied ones, so
 * recognition has to rest on the exact object rather than on its kind.
 */
export const OBJECT_RECALL_LEVELS = defineLevels<ObjectRecallProfile>([
  {
    objective: 'Recognise 3 objects among 6.',
    challengeCount: 4,
    kind: 'mixed',
    studied: 3,
    board: 6,
    families: 0,
    columns: 3,
    timing: look(3, 2000),
  },
  {
    objective: 'Recognise 4 objects among 8.',
    challengeCount: 4,
    kind: 'mixed',
    studied: 4,
    board: 8,
    families: 0,
    columns: 4,
    timing: look(4, 1800),
  },
  {
    objective: 'Recognise 5 objects among 10.',
    challengeCount: 4,
    kind: 'mixed',
    studied: 5,
    board: 10,
    families: 0,
    columns: 4,
    timing: look(5, 1600),
  },
  {
    objective: 'Recognise 5 objects when the new ones are of the same kind.',
    challengeCount: 4,
    kind: 'family',
    studied: 5,
    board: 10,
    families: 2,
    columns: 4,
    timing: look(5, 1600),
  },
  {
    objective: 'Recognise 6 objects among 12.',
    challengeCount: 4,
    kind: 'mixed',
    studied: 6,
    board: 12,
    families: 0,
    columns: 4,
    timing: look(6, 1400),
  },
  {
    objective: 'Recognise 6 objects among 12 look-alikes from the same families.',
    challengeCount: 4,
    kind: 'family',
    studied: 6,
    board: 12,
    families: 2,
    columns: 4,
    timing: look(6, 1300),
  },
  {
    objective: 'Recognise 7 objects among 14 of the same families.',
    challengeCount: 3,
    kind: 'family',
    studied: 7,
    board: 14,
    families: 2,
    columns: 4,
    timing: look(7, 1200),
  },
  {
    objective: 'Recognise 8 objects among 16 with a shorter look.',
    challengeCount: 3,
    kind: 'family',
    studied: 8,
    board: 16,
    families: 3,
    columns: 4,
    timing: look(8, 1000),
  },
  {
    objective: 'Recognise 9 objects among 18 from three families.',
    challengeCount: 3,
    kind: 'family',
    studied: 9,
    board: 18,
    families: 3,
    columns: 4,
    timing: look(9, 900),
  },
  {
    objective: 'Recognise 10 objects among 20 with a brief look.',
    challengeCount: 3,
    kind: 'family',
    studied: 10,
    board: 20,
    families: 3,
    columns: 4,
    timing: look(10, 800),
  },
]);
