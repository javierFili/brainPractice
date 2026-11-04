import { msg, type Text } from '@/domain/shared';
import { defineLevels, timed } from '@/games/kit/content';
import type { Mutation, SymbolMatchProfile, SymbolPool } from './types';

const SUB: readonly Mutation[] = ['substitute'];
const BOTH: readonly Mutation[] = ['substitute', 'transpose'];

const row = (
  objective: Text,
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
  row(msg('speed:rapidSymbolMatching.levels.1'), SD, 'letters', 3, 2, 2, SUB, [2000, 5000], 12),
  row(msg('speed:rapidSymbolMatching.levels.2'), SD, 'letters', 4, 2, 1, SUB, [1800, 4500], 14),
  row(msg('speed:rapidSymbolMatching.levels.3'), SD, 'shapes', 4, 2, 1, SUB, [1800, 4500], 14),
  row(msg('speed:rapidSymbolMatching.levels.4'), FM, 'shapes', 4, 3, 1, SUB, [2800, 6000], 12),
  row(
    msg('speed:rapidSymbolMatching.levels.5'),
    { 'same-different': 1, 'find-match': 1 },
    'confusable',
    4,
    3,
    1,
    SUB,
    [2600, 6000],
    14,
  ),
  row(msg('speed:rapidSymbolMatching.levels.6'), FM, 'confusable', 5, 3, 1, SUB, [3000, 6500], 14),
  row(
    msg('speed:rapidSymbolMatching.levels.7'),
    { 'same-different': 2, 'find-match': 1 },
    'confusable',
    5,
    3,
    1,
    BOTH,
    [2800, 6000],
    16,
  ),
  row(msg('speed:rapidSymbolMatching.levels.8'), FM, 'confusable', 6, 4, 1, BOTH, [3500, 7000], 16),
  row(
    msg('speed:rapidSymbolMatching.levels.9'),
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
    msg('speed:rapidSymbolMatching.levels.10'),
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
