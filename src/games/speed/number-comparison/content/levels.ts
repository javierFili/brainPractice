import { msg, type Text } from '@/domain/shared';
import { defineLevels, timed } from '@/games/kit/content';
import type { NumberComparisonProfile } from './types';

const row = (
  objective: Text,
  kinds: NumberComparisonProfile['kinds'],
  optionCount: number,
  digits: number,
  closeness: number,
  smallestShare: number,
  [targetMs, limitMs]: readonly [number, number],
  challengeCount: number,
) => ({
  objective,
  kinds,
  optionCount,
  digits,
  closeness,
  smallestShare,
  challengeCount,
  timing: timed(targetMs, limitMs),
});

const INTEGERS = { integers: 1 } as const;

/**
 * From two one-digit numbers far apart to four values in mixed notations that are close together.
 * The distance shrinks before new notations arrive, and "smallest" questions break the habit of
 * always looking for the biggest.
 */
export const NUMBER_COMPARISON_LEVELS = defineLevels<NumberComparisonProfile>([
  row(msg('speed:numberComparison.levels.1'), INTEGERS, 2, 1, 0, 0, [1500, 4000], 14),
  row(msg('speed:numberComparison.levels.2'), INTEGERS, 2, 2, 0.7, 0, [1600, 4000], 14),
  row(msg('speed:numberComparison.levels.3'), INTEGERS, 3, 2, 0.85, 0, [1800, 4000], 14),
  row(msg('speed:numberComparison.levels.4'), INTEGERS, 3, 3, 0.95, 0.3, [2000, 4500], 14),
  row(msg('speed:numberComparison.levels.5'), INTEGERS, 4, 4, 0.99, 0.5, [2500, 5000], 14),
  row(msg('speed:numberComparison.levels.6'), { decimals: 1 }, 4, 4, 0.5, 0.5, [2500, 5000], 14),
  row(msg('speed:numberComparison.levels.7'), { decimals: 1 }, 4, 4, 0.9, 0.5, [2800, 5500], 14),
  row(msg('speed:numberComparison.levels.8'), { fractions: 1 }, 4, 4, 0.9, 0.5, [3500, 7000], 12),
  row(msg('speed:numberComparison.levels.9'), { expressions: 1 }, 4, 4, 0.9, 0.5, [4000, 8000], 12),
  row(
    msg('speed:numberComparison.levels.10'),
    { integers: 1, decimals: 1, fractions: 1, expressions: 1 },
    4,
    4,
    1,
    0.5,
    [4000, 8000],
    14,
  ),
]);
