import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { TruthProfile } from './types';

/**
 * Two characters talking about each other, then a third character, statements comparing two
 * people, statements counting the whole group, and finally four characters with every kind of
 * statement and a question about the whole group.
 */
export const TRUTH_LEVELS = defineLevels<TruthProfile>([
  {
    objective: msg('logic:truthAndFalsehood.levels.1'),
    challengeCount: 5,
    timing: untimed(30_000),
    characters: 2,
    claimTypes: { is: 3, same: 1 },
    asks: { one: 1 },
  },
  {
    objective: msg('logic:truthAndFalsehood.levels.2'),
    challengeCount: 5,
    timing: untimed(35_000),
    characters: 2,
    claimTypes: { is: 1, same: 1, different: 1, count: 1 },
    asks: { one: 1, who: 1 },
  },
  {
    objective: msg('logic:truthAndFalsehood.levels.3'),
    challengeCount: 5,
    timing: untimed(50_000),
    characters: 3,
    claimTypes: { is: 3, same: 1 },
    asks: { one: 1, who: 1 },
  },
  {
    objective: msg('logic:truthAndFalsehood.levels.4'),
    challengeCount: 5,
    timing: untimed(60_000),
    characters: 3,
    claimTypes: { is: 2, same: 1, different: 1 },
    asks: { one: 1, who: 2 },
  },
  {
    objective: msg('logic:truthAndFalsehood.levels.5'),
    challengeCount: 5,
    timing: untimed(70_000),
    characters: 3,
    claimTypes: { is: 2, count: 1, different: 1 },
    asks: { who: 2, count: 1 },
  },
  {
    objective: msg('logic:truthAndFalsehood.levels.6'),
    challengeCount: 5,
    timing: untimed(80_000),
    characters: 3,
    claimTypes: { is: 1, same: 1, different: 1, count: 1, either: 1 },
    asks: { who: 2, count: 1 },
  },
  {
    objective: msg('logic:truthAndFalsehood.levels.7'),
    challengeCount: 4,
    timing: untimed(100_000),
    characters: 4,
    claimTypes: { is: 3, same: 1, different: 1 },
    asks: { one: 1, who: 2 },
  },
  {
    objective: msg('logic:truthAndFalsehood.levels.8'),
    challengeCount: 4,
    timing: untimed(110_000),
    characters: 4,
    claimTypes: { is: 2, either: 1, different: 1, count: 1 },
    asks: { who: 2, count: 1 },
  },
  {
    objective: msg('logic:truthAndFalsehood.levels.9'),
    challengeCount: 4,
    timing: untimed(120_000),
    characters: 4,
    claimTypes: { is: 1, count: 2, same: 1, either: 1 },
    asks: { who: 1, count: 1 },
  },
  {
    objective: msg('logic:truthAndFalsehood.levels.10'),
    challengeCount: 4,
    timing: untimed(140_000),
    characters: 4,
    claimTypes: { is: 1, same: 1, different: 1, count: 2, either: 2 },
    asks: { who: 1, count: 1, one: 1 },
  },
]);
