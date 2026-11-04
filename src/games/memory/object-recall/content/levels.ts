import { msg } from '@/domain/shared';
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
    objective: msg('memory:objectRecall.levels.1'),
    challengeCount: 4,
    kind: 'mixed',
    studied: 3,
    board: 6,
    families: 0,
    columns: 3,
    timing: look(3, 2000),
  },
  {
    objective: msg('memory:objectRecall.levels.2'),
    challengeCount: 4,
    kind: 'mixed',
    studied: 4,
    board: 8,
    families: 0,
    columns: 4,
    timing: look(4, 1800),
  },
  {
    objective: msg('memory:objectRecall.levels.3'),
    challengeCount: 4,
    kind: 'mixed',
    studied: 5,
    board: 10,
    families: 0,
    columns: 4,
    timing: look(5, 1600),
  },
  {
    objective: msg('memory:objectRecall.levels.4'),
    challengeCount: 4,
    kind: 'family',
    studied: 5,
    board: 10,
    families: 2,
    columns: 4,
    timing: look(5, 1600),
  },
  {
    objective: msg('memory:objectRecall.levels.5'),
    challengeCount: 4,
    kind: 'mixed',
    studied: 6,
    board: 12,
    families: 0,
    columns: 4,
    timing: look(6, 1400),
  },
  {
    objective: msg('memory:objectRecall.levels.6'),
    challengeCount: 4,
    kind: 'family',
    studied: 6,
    board: 12,
    families: 2,
    columns: 4,
    timing: look(6, 1300),
  },
  {
    objective: msg('memory:objectRecall.levels.7'),
    challengeCount: 3,
    kind: 'family',
    studied: 7,
    board: 14,
    families: 2,
    columns: 4,
    timing: look(7, 1200),
  },
  {
    objective: msg('memory:objectRecall.levels.8'),
    challengeCount: 3,
    kind: 'family',
    studied: 8,
    board: 16,
    families: 3,
    columns: 4,
    timing: look(8, 1000),
  },
  {
    objective: msg('memory:objectRecall.levels.9'),
    challengeCount: 3,
    kind: 'family',
    studied: 9,
    board: 18,
    families: 3,
    columns: 4,
    timing: look(9, 900),
  },
  {
    objective: msg('memory:objectRecall.levels.10'),
    challengeCount: 3,
    kind: 'family',
    studied: 10,
    board: 20,
    families: 3,
    columns: 4,
    timing: look(10, 800),
  },
]);
