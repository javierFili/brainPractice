import { defineLevels, timed } from '@/games/kit/content';
import type { Mutation, SymbolMatchProfile, SymbolPool } from './types';

const SUB: readonly Mutation[] = ['substitute'];
const BOTH: readonly Mutation[] = ['substitute', 'transpose'];

const row = (
  objective: string,
  kinds: SymbolMatchProfile['kinds'],
  pool: SymbolPool,
  length: number,
  optionCount: number,
  changes: number,
  mutations: readonly Mutation[],
  [targetMs, limitMs]: readonly [number, number],
  challengeCount: number,
) => ({
  objective,
  kinds,
  pool,
  length,
  optionCount,
  changes,
  mutations,
  challengeCount,
  timing: timed(targetMs, limitMs),
});

const SD = { 'same-different': 1 } as const;
const FM = { 'find-match': 1 } as const;

/**
 * Short strings with two changed symbols → one change → look-alike symbols (b/d/p/q, O/Q) →
 * swapped neighbours, which keep every symbol and only change their order; plus more candidates.
 */
export const SYMBOL_MATCH_LEVELS = defineLevels<SymbolMatchProfile>([
  row('Same or different? Three letters.', SD, 'letters', 3, 2, 2, SUB, [2000, 5000], 12),
  row('Four letters, only one may change.', SD, 'letters', 4, 2, 1, SUB, [1800, 4500], 14),
  row('Four symbols, only one may change.', SD, 'shapes', 4, 2, 1, SUB, [1800, 4500], 14),
  row('Find the exact copy among three.', FM, 'shapes', 4, 3, 1, SUB, [2800, 6000], 12),
  row(
    'Look-alike letters: b, d, p, q…',
    { 'same-different': 1, 'find-match': 1 },
    'confusable',
    4,
    3,
    1,
    SUB,
    [2600, 6000],
    14,
  ),
  row('Five look-alikes, three candidates.', FM, 'confusable', 5, 3, 1, SUB, [3000, 6500], 14),
  row(
    'Swapped neighbours count as different.',
    { 'same-different': 2, 'find-match': 1 },
    'confusable',
    5,
    3,
    1,
    BOTH,
    [2800, 6000],
    16,
  ),
  row('Six look-alikes, four candidates.', FM, 'confusable', 6, 4, 1, BOTH, [3500, 7000], 16),
  row(
    'Six look-alikes, same or different — quicker.',
    { 'same-different': 2, 'find-match': 1 },
    'confusable',
    6,
    4,
    1,
    BOTH,
    [3000, 6500],
    18,
  ),
  row(
    'Master: seven look-alikes, four candidates.',
    FM,
    'confusable',
    7,
    4,
    1,
    BOTH,
    [3800, 7500],
    18,
  ),
]);
