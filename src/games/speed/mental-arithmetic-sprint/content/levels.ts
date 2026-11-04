import { msg, type Text } from '@/domain/shared';
import { defineLevels, timed } from '@/games/kit/content';
import type { ArithmeticProfile, OperationFamily } from './types';

const VERIFY = { verify: 1 } as const;
const SOLVE = { solve: 1 } as const;

const row = (
  objective: Text,
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
  row(msg('speed:mentalArithmeticSprint.levels.1'), VERIFY, ['add-small'], [2500, 6000], 12),
  row(msg('speed:mentalArithmeticSprint.levels.2'), VERIFY, ['add-sub-20'], [2800, 6000], 12),
  row(msg('speed:mentalArithmeticSprint.levels.3'), SOLVE, ['add-sub-20'], [3500, 8000], 10),
  row(
    msg('speed:mentalArithmeticSprint.levels.4'),
    VERIFY,
    ['times-table', 'division'],
    [3000, 6500],
    14,
  ),
  row(
    msg('speed:mentalArithmeticSprint.levels.5'),
    SOLVE,
    ['times-table', 'division'],
    [3500, 8000],
    12,
  ),
  row(
    msg('speed:mentalArithmeticSprint.levels.6'),
    { verify: 1, solve: 1 },
    ['add-sub-20', 'times-table', 'add-sub-2d'],
    [4500, 10000],
    12,
  ),
  row(msg('speed:mentalArithmeticSprint.levels.7'), SOLVE, ['add-sub-2d'], [5000, 11000], 12),
  row(
    msg('speed:mentalArithmeticSprint.levels.8'),
    SOLVE,
    ['add-sub-2d', 'times-2d'],
    [6000, 12000],
    12,
  ),
  row(
    msg('speed:mentalArithmeticSprint.levels.9'),
    VERIFY,
    ['precedence', 'brackets'],
    [4500, 9000],
    14,
  ),
  row(
    msg('speed:mentalArithmeticSprint.levels.10'),
    SOLVE,
    ['times-2d', 'precedence', 'brackets'],
    [6000, 12000],
    14,
  ),
]);
