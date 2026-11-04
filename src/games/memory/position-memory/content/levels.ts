import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { PositionMemoryProfile } from './types';

const show = (ms: number, targets: number) => untimed(targets * 2500 + 2000, ms);

/**
 * The grid grows from 3×3 to 6×6 and the number of cells to remember from 2 to 8 while exposure
 * shrinks. From level 5, distractor cells in another colour must be ignored (filtering).
 */
export const POSITION_MEMORY_LEVELS = defineLevels<PositionMemoryProfile>([
  {
    objective: msg('memory:positionMemory.levels.1'),
    challengeCount: 5,
    kind: 'plain',
    size: 3,
    targets: 2,
    distractors: 0,
    timing: show(3000, 2),
  },
  {
    objective: msg('memory:positionMemory.levels.2'),
    challengeCount: 5,
    kind: 'plain',
    size: 3,
    targets: 3,
    distractors: 0,
    timing: show(3000, 3),
  },
  {
    objective: msg('memory:positionMemory.levels.3'),
    challengeCount: 5,
    kind: 'plain',
    size: 4,
    targets: 3,
    distractors: 0,
    timing: show(2500, 3),
  },
  {
    objective: msg('memory:positionMemory.levels.4'),
    challengeCount: 6,
    kind: 'plain',
    size: 4,
    targets: 4,
    distractors: 0,
    timing: show(2500, 4),
  },
  {
    objective: msg('memory:positionMemory.levels.5'),
    challengeCount: 6,
    kind: 'filtered',
    size: 4,
    targets: 4,
    distractors: 2,
    timing: show(2500, 4),
  },
  {
    objective: msg('memory:positionMemory.levels.6'),
    challengeCount: 6,
    kind: 'plain',
    size: 5,
    targets: 5,
    distractors: 0,
    timing: show(2500, 5),
  },
  {
    objective: msg('memory:positionMemory.levels.7'),
    challengeCount: 6,
    kind: 'filtered',
    size: 5,
    targets: 5,
    distractors: 3,
    timing: show(2500, 5),
  },
  {
    objective: msg('memory:positionMemory.levels.8'),
    challengeCount: 6,
    kind: 'plain',
    size: 5,
    targets: 6,
    distractors: 0,
    timing: show(2000, 6),
  },
  {
    objective: msg('memory:positionMemory.levels.9'),
    challengeCount: 6,
    kind: 'filtered',
    size: 6,
    targets: 7,
    distractors: 3,
    timing: show(2500, 7),
  },
  {
    objective: msg('memory:positionMemory.levels.10'),
    challengeCount: 6,
    kind: 'filtered',
    size: 6,
    targets: 8,
    distractors: 4,
    timing: show(2500, 8),
  },
]);
