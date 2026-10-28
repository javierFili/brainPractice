import { defineLevels, timed } from '@/games/kit/content';
import type { FastSequenceProfile, SequenceChange, SequenceKind } from './types';

const BOTH: readonly SequenceChange[] = ['substitute', 'swap'];
const SWAP: readonly SequenceChange[] = ['swap'];

const row = (
  objective: string,
  kind: SequenceKind | FastSequenceProfile['kinds'],
  length: number,
  optionCount: number,
  studyMs: number,
  changes: readonly SequenceChange[],
  [targetMs, limitMs]: readonly [number, number],
  challengeCount: number,
) => ({
  objective,
  kinds: typeof kind === 'string' ? { [kind]: 1 } : kind,
  length,
  optionCount,
  changes,
  challengeCount,
  timing: timed(targetMs, limitMs, studyMs),
});

/**
 * Longer sequences, shorter glimpses and more candidates; at the top every candidate holds the
 * same symbols and only the order tells them apart. The glimpse never drops below one second.
 */
export const FAST_SEQUENCE_LEVELS = defineLevels<FastSequenceProfile>([
  row(
    'Glimpse 3 digits, then pick them out of 2.',
    'digits',
    3,
    2,
    2500,
    ['substitute'],
    [2500, 6000],
    10,
  ),
  row('4 digits, 3 candidates.', 'digits', 4, 3, 2200, BOTH, [2800, 6000], 10),
  row('4 letters, 3 candidates.', 'letters', 4, 3, 2000, BOTH, [2800, 6000], 12),
  row('4 shapes, 3 candidates.', 'shapes', 4, 3, 1800, BOTH, [3000, 6500], 12),
  row('5 digits, 4 candidates.', 'digits', 5, 4, 1800, BOTH, [3200, 7000], 12),
  row('5 letters, shorter glimpse.', 'letters', 5, 4, 1500, BOTH, [3200, 7000], 12),
  row('5 shapes, shorter glimpse.', 'shapes', 5, 4, 1500, BOTH, [3400, 7000], 14),
  row('6 digits: only the order differs.', 'digits', 6, 4, 1400, SWAP, [3600, 7500], 14),
  row('6 letters: only the order differs.', 'letters', 6, 4, 1200, SWAP, [3600, 7500], 14),
  row(
    'Master: 7 digits or shapes, one-second glimpse, order only.',
    { digits: 1, shapes: 1 },
    7,
    4,
    1000,
    SWAP,
    [4000, 8000],
    14,
  ),
]);
