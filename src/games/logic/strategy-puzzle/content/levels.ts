import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { StrategyProfile } from './types';

const base = {
  takeAway: { maxTake: 2, pile: [4, 14] as const },
  piles: { count: 2, max: 5 },
  jugs: { count: 2 as const, moves: [2, 4] as const },
  sliding: { rows: 2, cols: 2, moves: [2, 4] as const },
};

/**
 * Small coin games and 2×2 tiles for beginners; then two-jug puzzles, longer take-away games,
 * 2×3 tiles, two and three piles, and three jugs with no tap (pouring only).
 */
export const STRATEGY_LEVELS = defineLevels<StrategyProfile>([
  {
    objective: msg('logic:strategyPuzzle.levels.1'),
    challengeCount: 4,
    timing: untimed(30_000),
    ...base,
    kinds: { 'take-away': 1 },
  },
  {
    objective: msg('logic:strategyPuzzle.levels.2'),
    challengeCount: 4,
    timing: untimed(40_000),
    ...base,
    kinds: { 'take-away': 1, sliding: 1 },
  },
  {
    objective: msg('logic:strategyPuzzle.levels.3'),
    challengeCount: 4,
    timing: untimed(60_000),
    ...base,
    kinds: { jugs: 2, sliding: 1 },
  },
  {
    objective: msg('logic:strategyPuzzle.levels.4'),
    challengeCount: 4,
    timing: untimed(60_000),
    ...base,
    takeAway: { maxTake: 3, pile: [9, 19] },
    jugs: { count: 2, moves: [3, 5] },
    kinds: { 'take-away': 2, jugs: 1 },
  },
  {
    objective: msg('logic:strategyPuzzle.levels.5'),
    challengeCount: 4,
    timing: untimed(80_000),
    ...base,
    takeAway: { maxTake: 3, pile: [9, 19] },
    jugs: { count: 2, moves: [3, 5] },
    sliding: { rows: 2, cols: 3, moves: [4, 7] },
    kinds: { sliding: 2, 'take-away': 1 },
  },
  {
    objective: msg('logic:strategyPuzzle.levels.6'),
    challengeCount: 4,
    timing: untimed(90_000),
    ...base,
    takeAway: { maxTake: 3, pile: [9, 19] },
    jugs: { count: 2, moves: [5, 8] },
    sliding: { rows: 2, cols: 3, moves: [5, 9] },
    kinds: { jugs: 2, sliding: 1 },
  },
  {
    objective: msg('logic:strategyPuzzle.levels.7'),
    challengeCount: 4,
    timing: untimed(90_000),
    ...base,
    takeAway: { maxTake: 4, pile: [12, 24] },
    jugs: { count: 2, moves: [5, 8] },
    sliding: { rows: 2, cols: 3, moves: [6, 10] },
    kinds: { piles: 2, 'take-away': 1 },
  },
  {
    objective: msg('logic:strategyPuzzle.levels.8'),
    challengeCount: 4,
    timing: untimed(120_000),
    ...base,
    takeAway: { maxTake: 4, pile: [12, 24] },
    piles: { count: 2, max: 7 },
    jugs: { count: 2, moves: [6, 9] },
    sliding: { rows: 2, cols: 3, moves: [9, 13] },
    kinds: { sliding: 2, piles: 1 },
  },
  {
    objective: msg('logic:strategyPuzzle.levels.9'),
    challengeCount: 4,
    timing: untimed(120_000),
    ...base,
    takeAway: { maxTake: 4, pile: [12, 24] },
    piles: { count: 3, max: 5 },
    jugs: { count: 3, moves: [4, 9] },
    sliding: { rows: 2, cols: 3, moves: [10, 15] },
    kinds: { jugs: 2, piles: 1 },
  },
  {
    objective: msg('logic:strategyPuzzle.levels.10'),
    challengeCount: 5,
    timing: untimed(150_000),
    ...base,
    takeAway: { maxTake: 4, pile: [12, 24] },
    piles: { count: 3, max: 6 },
    jugs: { count: 3, moves: [6, 10] },
    sliding: { rows: 2, cols: 3, moves: [13, 21] },
    kinds: { piles: 1, sliding: 1, jugs: 1 },
  },
]);
