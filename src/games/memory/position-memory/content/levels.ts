import { defineLevels, untimed } from '@/games/kit/content';
import type { PositionMemoryProfile } from './types';

const show = (ms: number, targets: number) => untimed(targets * 2500 + 2000, ms);

/**
 * The grid grows from 3×3 to 6×6 and the number of cells to remember from 2 to 8 while exposure
 * shrinks. From level 5, distractor cells in another colour must be ignored (filtering).
 */
export const POSITION_MEMORY_LEVELS = defineLevels<PositionMemoryProfile>([
  {
    objective: 'Remember 2 lit cells on a 3×3 grid.',
    challengeCount: 5,
    kind: 'plain',
    size: 3,
    targets: 2,
    distractors: 0,
    timing: show(3000, 2),
  },
  {
    objective: 'Remember 3 lit cells on a 3×3 grid.',
    challengeCount: 5,
    kind: 'plain',
    size: 3,
    targets: 3,
    distractors: 0,
    timing: show(3000, 3),
  },
  {
    objective: 'Remember 3 cells on a bigger 4×4 grid.',
    challengeCount: 5,
    kind: 'plain',
    size: 4,
    targets: 3,
    distractors: 0,
    timing: show(2500, 3),
  },
  {
    objective: 'Remember 4 cells on a 4×4 grid.',
    challengeCount: 6,
    kind: 'plain',
    size: 4,
    targets: 4,
    distractors: 0,
    timing: show(2500, 4),
  },
  {
    objective: 'Remember 4 blue cells and ignore 2 orange ones.',
    challengeCount: 6,
    kind: 'filtered',
    size: 4,
    targets: 4,
    distractors: 2,
    timing: show(2500, 4),
  },
  {
    objective: 'Remember 5 cells on a 5×5 grid.',
    challengeCount: 6,
    kind: 'plain',
    size: 5,
    targets: 5,
    distractors: 0,
    timing: show(2500, 5),
  },
  {
    objective: 'Remember 5 blue cells among 3 distractors.',
    challengeCount: 6,
    kind: 'filtered',
    size: 5,
    targets: 5,
    distractors: 3,
    timing: show(2500, 5),
  },
  {
    objective: 'Remember 6 cells with a short look.',
    challengeCount: 6,
    kind: 'plain',
    size: 5,
    targets: 6,
    distractors: 0,
    timing: show(2000, 6),
  },
  {
    objective: 'Remember 7 blue cells among 3 distractors on 6×6.',
    challengeCount: 6,
    kind: 'filtered',
    size: 6,
    targets: 7,
    distractors: 3,
    timing: show(2500, 7),
  },
  {
    objective: 'Remember 8 blue cells among 4 distractors on 6×6.',
    challengeCount: 6,
    kind: 'filtered',
    size: 6,
    targets: 8,
    distractors: 4,
    timing: show(2500, 8),
  },
]);
