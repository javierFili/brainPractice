import { defineLevels, untimed } from '@/games/kit/content';
import type { ConstraintProfile } from './types';

/**
 * 3×3 Latin squares for beginners, then 4×4, boxes (mini sudoku), 5×5, and finally grids with
 * "smaller than" clues and few givens, up to 6×6 with boxes.
 */
export const CONSTRAINT_LEVELS = defineLevels<ConstraintProfile>([
  {
    objective: 'A 3×3 grid with most numbers given.',
    challengeCount: 5,
    timing: untimed(20_000),
    size: 3,
    box: null,
    givenShare: 0.6,
    inequalities: 0,
  },
  {
    objective: 'A 3×3 grid with fewer numbers.',
    challengeCount: 5,
    timing: untimed(30_000),
    size: 3,
    box: null,
    givenShare: 0.3,
    inequalities: 0,
  },
  {
    objective: 'A 4×4 grid.',
    challengeCount: 5,
    timing: untimed(40_000),
    size: 4,
    box: null,
    givenShare: 0.5,
    inequalities: 0,
  },
  {
    objective: 'A 4×4 grid with boxes.',
    challengeCount: 5,
    timing: untimed(50_000),
    size: 4,
    box: [2, 2],
    givenShare: 0.35,
    inequalities: 0,
  },
  {
    objective: 'A 4×4 grid with “smaller than” clues.',
    challengeCount: 4,
    timing: untimed(70_000),
    size: 4,
    box: null,
    givenShare: 0.2,
    inequalities: 4,
  },
  {
    objective: 'A 5×5 grid.',
    challengeCount: 4,
    timing: untimed(60_000),
    size: 5,
    box: null,
    givenShare: 0.45,
    inequalities: 0,
  },
  {
    objective: 'A 5×5 grid with “smaller than” clues.',
    challengeCount: 4,
    timing: untimed(100_000),
    size: 5,
    box: null,
    givenShare: 0.25,
    inequalities: 6,
  },
  {
    objective: 'A 6×6 grid with boxes.',
    challengeCount: 4,
    timing: untimed(90_000),
    size: 6,
    box: [2, 3],
    givenShare: 0.45,
    inequalities: 0,
  },
  {
    objective: 'A 6×6 grid with boxes and few numbers.',
    challengeCount: 3,
    timing: untimed(120_000),
    size: 6,
    box: [2, 3],
    givenShare: 0.35,
    inequalities: 0,
  },
  {
    objective: 'A 6×6 grid with boxes and “smaller than” clues.',
    challengeCount: 3,
    timing: untimed(150_000),
    size: 6,
    box: [2, 3],
    givenShare: 0.25,
    inequalities: 6,
  },
]);
