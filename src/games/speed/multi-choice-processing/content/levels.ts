import { defineLevels, timed } from '@/games/kit/content';
import type { FlankerProfile } from './types';

const row = (
  objective: string,
  kind: FlankerProfile['kind'],
  directionCount: 2 | 4,
  rowLength: number,
  incongruentShare: number,
  neutralShare: number,
  outerShare: number,
  [targetMs, limitMs]: readonly [number, number],
  challengeCount: number,
) => ({
  objective,
  kind,
  directionCount,
  rowLength,
  incongruentShare,
  neutralShare,
  outerShare,
  challengeCount,
  timing: timed(targetMs, limitMs),
});

/**
 * A plain two-choice reaction → flankers that agree → flankers that conflict → four directions
 * and longer rows → a second, cued rule (answer the outer arrows) mixed with the first.
 */
export const FLANKER_LEVELS = defineLevels<FlankerProfile>([
  row('Which way does the arrow point?', 'single', 2, 1, 0, 0, 0, [1000, 3000], 12),
  row(
    'Answer the centre arrow; the others agree or are bars.',
    'flanker',
    2,
    5,
    0,
    0.5,
    0,
    [1100, 3000],
    14,
  ),
  row('Some outer arrows now point the other way.', 'flanker', 2, 5, 0.3, 0.3, 0, [1200, 3000], 14),
  row('Half the rows conflict.', 'flanker', 2, 5, 0.5, 0.2, 0, [1200, 2800], 16),
  row('Four directions: left, right, up, down.', 'flanker', 4, 5, 0.5, 0.2, 0, [1400, 3000], 16),
  row('Seven arrows in a row, more conflict.', 'flanker', 4, 7, 0.6, 0.1, 0, [1500, 3000], 16),
  row('Follow the cue: CENTRE arrow or OUTER arrows.', 'cued', 4, 7, 0.6, 0, 0.3, [1800, 3500], 16),
  row('Outer-arrow trials more often.', 'cued', 4, 7, 0.65, 0, 0.4, [1800, 3400], 18),
  row('Rules mixed half and half.', 'cued', 4, 7, 0.7, 0, 0.5, [1700, 3200], 18),
  row(
    'Master: mixed rules, mostly conflicting rows, less time.',
    'cued',
    4,
    7,
    0.8,
    0,
    0.5,
    [1600, 3000],
    20,
  ),
]);
