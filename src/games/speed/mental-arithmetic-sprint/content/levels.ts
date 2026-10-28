import { defineLevels, timed } from '@/games/kit/content';
import type { ArithmeticProfile, OperationFamily } from './types';

const VERIFY = { verify: 1 } as const;
const SOLVE = { solve: 1 } as const;

const row = (
  objective: string,
  kinds: ArithmeticProfile['kinds'],
  families: readonly OperationFamily[],
  [targetMs, limitMs]: readonly [number, number],
  challengeCount: number,
) => ({ objective, kinds, families, challengeCount, timing: timed(targetMs, limitMs) });

/**
 * True/false checks first (recognising a result is faster than producing one), then typed answers;
 * operations go from one-digit sums to two-digit products and three-operand expressions where
 * precedence or brackets matter. Limits grow with the work a level needs, not with the level.
 */
export const ARITHMETIC_LEVELS = defineLevels<ArithmeticProfile>([
  row('True or false: one-digit sums.', VERIFY, ['add-small'], [2500, 6000], 12),
  row('True or false: sums and differences up to 20.', VERIFY, ['add-sub-20'], [2800, 6000], 12),
  row('Type the answer: sums and differences up to 20.', SOLVE, ['add-sub-20'], [3500, 8000], 10),
  row(
    'True or false: times tables and division.',
    VERIFY,
    ['times-table', 'division'],
    [3000, 6500],
    14,
  ),
  row(
    'Type the answer: times tables and division.',
    SOLVE,
    ['times-table', 'division'],
    [3500, 8000],
    12,
  ),
  row(
    'Mixed checks and answers with two-digit numbers.',
    { verify: 1, solve: 1 },
    ['add-sub-20', 'times-table', 'add-sub-2d'],
    [4500, 10000],
    12,
  ),
  row('Type the answer: two-digit sums and differences.', SOLVE, ['add-sub-2d'], [5000, 11000], 12),
  row(
    'Type the answer: two-digit × one-digit.',
    SOLVE,
    ['add-sub-2d', 'times-2d'],
    [6000, 12000],
    12,
  ),
  row(
    'True or false: three numbers — multiply before adding.',
    VERIFY,
    ['precedence', 'brackets'],
    [4500, 9000],
    14,
  ),
  row(
    'Master: type the answer to three-number expressions and two-digit products.',
    SOLVE,
    ['times-2d', 'precedence', 'brackets'],
    [6000, 12000],
    14,
  ),
]);
