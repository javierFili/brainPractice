import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { ConstraintProfile } from './types';

/**
 * 3×3 Latin squares for beginners, then 4×4, boxes (mini sudoku), 5×5, and finally grids with
 * "smaller than" clues and few givens, up to 6×6 with boxes.
 */
export const CONSTRAINT_LEVELS = defineLevels<ConstraintProfile>([
  {
    objective: msg('logic:constraintSolver.levels.1'),
    challengeCount: 5,
    timing: untimed(20_000),
    size: 3,
    box: null,
    givenShare: 0.6,
    inequalities: 0,
  },
  {
    objective: msg('logic:constraintSolver.levels.2'),
    challengeCount: 5,
    timing: untimed(30_000),
    size: 3,
    box: null,
    givenShare: 0.3,
    inequalities: 0,
  },
  {
    objective: msg('logic:constraintSolver.levels.3'),
    challengeCount: 5,
    timing: untimed(40_000),
    size: 4,
    box: null,
    givenShare: 0.5,
    inequalities: 0,
  },
  {
    objective: msg('logic:constraintSolver.levels.4'),
    challengeCount: 5,
    timing: untimed(50_000),
    size: 4,
    box: [2, 2],
    givenShare: 0.35,
    inequalities: 0,
  },
  {
    objective: msg('logic:constraintSolver.levels.5'),
    challengeCount: 4,
    timing: untimed(70_000),
    size: 4,
    box: null,
    givenShare: 0.2,
    inequalities: 4,
  },
  {
    objective: msg('logic:constraintSolver.levels.6'),
    challengeCount: 4,
    timing: untimed(60_000),
    size: 5,
    box: null,
    givenShare: 0.45,
    inequalities: 0,
  },
  {
    objective: msg('logic:constraintSolver.levels.7'),
    challengeCount: 4,
    timing: untimed(100_000),
    size: 5,
    box: null,
    givenShare: 0.25,
    inequalities: 6,
  },
  {
    objective: msg('logic:constraintSolver.levels.8'),
    challengeCount: 4,
    timing: untimed(90_000),
    size: 6,
    box: [2, 3],
    givenShare: 0.45,
    inequalities: 0,
  },
  {
    objective: msg('logic:constraintSolver.levels.9'),
    challengeCount: 3,
    timing: untimed(120_000),
    size: 6,
    box: [2, 3],
    givenShare: 0.35,
    inequalities: 0,
  },
  {
    objective: msg('logic:constraintSolver.levels.10'),
    challengeCount: 3,
    timing: untimed(150_000),
    size: 6,
    box: [2, 3],
    givenShare: 0.25,
    inequalities: 6,
  },
]);
