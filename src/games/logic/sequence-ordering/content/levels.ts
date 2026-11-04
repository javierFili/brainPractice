import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { OrderingProfile } from './types';

/**
 * Three names with direct clues for beginners, up to six names where most clues only relate
 * people to each other ("between", "not next to") instead of fixing a position.
 */
export const SEQUENCE_ORDERING_LEVELS = defineLevels<OrderingProfile>([
  {
    objective: msg('logic:sequenceOrdering.levels.1'),
    challengeCount: 4,
    timing: untimed(30_000),
    entities: 3,
    clueTypes: { before: 2, at: 1 },
  },
  {
    objective: msg('logic:sequenceOrdering.levels.2'),
    challengeCount: 4,
    timing: untimed(35_000),
    entities: 3,
    clueTypes: { before: 1, 'right-before': 1, 'not-at': 1 },
  },
  {
    objective: msg('logic:sequenceOrdering.levels.3'),
    challengeCount: 4,
    timing: untimed(45_000),
    entities: 4,
    clueTypes: { before: 2, at: 1, 'right-before': 1 },
  },
  {
    objective: msg('logic:sequenceOrdering.levels.4'),
    challengeCount: 4,
    timing: untimed(55_000),
    entities: 4,
    clueTypes: { before: 2, 'not-at': 2, 'right-before': 1 },
  },
  {
    objective: msg('logic:sequenceOrdering.levels.5'),
    challengeCount: 4,
    timing: untimed(60_000),
    entities: 4,
    clueTypes: { before: 1, gap: 2, 'next-to': 1, 'not-at': 1 },
  },
  {
    objective: msg('logic:sequenceOrdering.levels.6'),
    challengeCount: 4,
    timing: untimed(80_000),
    entities: 5,
    clueTypes: { before: 2, at: 1, 'right-before': 1, gap: 1 },
  },
  {
    objective: msg('logic:sequenceOrdering.levels.7'),
    challengeCount: 4,
    timing: untimed(90_000),
    entities: 5,
    clueTypes: { before: 2, gap: 1, 'next-to': 1, 'not-next-to': 1, 'not-at': 1 },
  },
  {
    objective: msg('logic:sequenceOrdering.levels.8'),
    challengeCount: 4,
    timing: untimed(100_000),
    entities: 5,
    clueTypes: { before: 2, gap: 2, 'next-to': 1, 'not-next-to': 1, 'right-before': 1 },
  },
  {
    objective: msg('logic:sequenceOrdering.levels.9'),
    challengeCount: 3,
    timing: untimed(130_000),
    entities: 6,
    clueTypes: { before: 2, at: 1, gap: 1, 'right-before': 1, 'not-at': 1 },
  },
  {
    objective: msg('logic:sequenceOrdering.levels.10'),
    challengeCount: 3,
    timing: untimed(160_000),
    entities: 6,
    clueTypes: { before: 2, gap: 2, 'next-to': 1, 'not-next-to': 1, 'right-before': 1 },
  },
]);
