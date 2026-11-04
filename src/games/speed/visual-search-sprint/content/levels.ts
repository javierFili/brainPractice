import { msg, type Text } from '@/domain/shared';
import { defineLevels, timed } from '@/games/kit/content';
import type { VisualSearchProfile } from './types';

const row = (
  objective: Text,
  kinds: VisualSearchProfile['kinds'],
  setSize: number,
  columns: number,
  [targetMs, limitMs]: readonly [number, number],
  challengeCount: number,
  lookAlikeConjunction = false,
) => ({
  objective,
  kinds,
  setSize,
  columns,
  lookAlikeConjunction,
  challengeCount,
  timing: timed(targetMs, limitMs),
});

/**
 * Feature search (the target pops out by shape) → look-alike shapes → conjunction search, where
 * the target shares a feature with every distractor and must be searched cell by cell. The grid
 * grows from 9 to 36 cells; the target time grows with it, as larger searches take longer.
 */
export const VISUAL_SEARCH_LEVELS = defineLevels<VisualSearchProfile>([
  row(msg('speed:visualSearchSprint.levels.1'), { feature: 1 }, 9, 3, [1800, 6000], 10),
  row(msg('speed:visualSearchSprint.levels.2'), { feature: 1 }, 12, 4, [2000, 6000], 12),
  row(msg('speed:visualSearchSprint.levels.3'), { similar: 1 }, 16, 4, [2400, 6500], 12),
  row(
    msg('speed:visualSearchSprint.levels.4'),
    { feature: 1, similar: 2 },
    16,
    4,
    [2600, 6500],
    12,
  ),
  row(msg('speed:visualSearchSprint.levels.5'), { conjunction: 1 }, 20, 5, [3000, 7000], 12),
  row(msg('speed:visualSearchSprint.levels.6'), { conjunction: 1 }, 25, 5, [3400, 7500], 14),
  row(
    msg('speed:visualSearchSprint.levels.7'),
    { conjunction: 2, similar: 1 },
    25,
    5,
    [3600, 7500],
    14,
  ),
  row(msg('speed:visualSearchSprint.levels.8'), { conjunction: 1 }, 30, 6, [4000, 8000], 14),
  row(msg('speed:visualSearchSprint.levels.9'), { conjunction: 1 }, 36, 6, [4400, 8500], 16),
  row(msg('speed:visualSearchSprint.levels.10'), { conjunction: 1 }, 36, 6, [4400, 8500], 16, true),
]);
