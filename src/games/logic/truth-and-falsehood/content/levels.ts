import { defineLevels, untimed } from '@/games/kit/content';
import type { TruthProfile } from './types';

/**
 * Two characters talking about each other, then a third character, statements comparing two
 * people, statements counting the whole group, and finally four characters with every kind of
 * statement and a question about the whole group.
 */
export const TRUTH_LEVELS = defineLevels<TruthProfile>([
  {
    objective: 'Two characters talk about each other.',
    challengeCount: 5,
    timing: untimed(30_000),
    characters: 2,
    claimTypes: { is: 3, same: 1 },
    asks: { one: 1 },
  },
  {
    objective: 'Two characters: “we are the same” or “different”.',
    challengeCount: 5,
    timing: untimed(35_000),
    characters: 2,
    claimTypes: { is: 1, same: 1, different: 1, count: 1 },
    asks: { one: 1, who: 1 },
  },
  {
    objective: 'Three characters.',
    challengeCount: 5,
    timing: untimed(50_000),
    characters: 3,
    claimTypes: { is: 3, same: 1 },
    asks: { one: 1, who: 1 },
  },
  {
    objective: 'Three characters comparing each other.',
    challengeCount: 5,
    timing: untimed(60_000),
    characters: 3,
    claimTypes: { is: 2, same: 1, different: 1 },
    asks: { one: 1, who: 2 },
  },
  {
    objective: 'Statements about the whole group.',
    challengeCount: 5,
    timing: untimed(70_000),
    characters: 3,
    claimTypes: { is: 2, count: 1, different: 1 },
    asks: { who: 2, count: 1 },
  },
  {
    objective: 'Three characters, every kind of statement.',
    challengeCount: 5,
    timing: untimed(80_000),
    characters: 3,
    claimTypes: { is: 1, same: 1, different: 1, count: 1, either: 1 },
    asks: { who: 2, count: 1 },
  },
  {
    objective: 'Four characters.',
    challengeCount: 4,
    timing: untimed(100_000),
    characters: 4,
    claimTypes: { is: 3, same: 1, different: 1 },
    asks: { one: 1, who: 2 },
  },
  {
    objective: 'Four characters, “at least one of” statements.',
    challengeCount: 4,
    timing: untimed(110_000),
    characters: 4,
    claimTypes: { is: 2, either: 1, different: 1, count: 1 },
    asks: { who: 2, count: 1 },
  },
  {
    objective: 'Four characters counting each other.',
    challengeCount: 4,
    timing: untimed(120_000),
    characters: 4,
    claimTypes: { is: 1, count: 2, same: 1, either: 1 },
    asks: { who: 1, count: 1 },
  },
  {
    objective: 'Four characters, every kind of statement.',
    challengeCount: 4,
    timing: untimed(140_000),
    characters: 4,
    claimTypes: { is: 1, same: 1, different: 1, count: 2, either: 2 },
    asks: { who: 1, count: 1, one: 1 },
  },
]);
