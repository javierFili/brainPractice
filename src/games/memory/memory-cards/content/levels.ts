import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { MemoryCardsProfile } from './types';

const preview = (ms: number, pairs: number) => untimed(pairs * 6000, ms);
const blind = (pairs: number) => untimed(pairs * 6000);

/**
 * Pairs grow from 3 to 12. The preview (all cards face up) shrinks and then disappears; faces
 * move from clearly different objects to look-alike shapes, so recall has to be exact.
 */
export const MEMORY_CARDS_LEVELS = defineLevels<MemoryCardsProfile>([
  {
    objective: msg('memory:memoryCards.levels.1'),
    challengeCount: 3,
    kind: 'objects',
    pairs: 3,
    maxMisses: 4,
    columns: 3,
    timing: preview(4000, 3),
  },
  {
    objective: msg('memory:memoryCards.levels.2'),
    challengeCount: 3,
    kind: 'objects',
    pairs: 4,
    maxMisses: 5,
    columns: 4,
    timing: preview(3000, 4),
  },
  {
    objective: msg('memory:memoryCards.levels.3'),
    challengeCount: 3,
    kind: 'family',
    pairs: 5,
    maxMisses: 6,
    columns: 5,
    timing: preview(3000, 5),
  },
  {
    objective: msg('memory:memoryCards.levels.4'),
    challengeCount: 2,
    kind: 'objects',
    pairs: 6,
    maxMisses: 7,
    columns: 4,
    timing: preview(2000, 6),
  },
  {
    objective: msg('memory:memoryCards.levels.5'),
    challengeCount: 2,
    kind: 'family',
    pairs: 6,
    maxMisses: 8,
    columns: 4,
    timing: blind(6),
  },
  {
    objective: msg('memory:memoryCards.levels.6'),
    challengeCount: 2,
    kind: 'glyphs',
    pairs: 8,
    maxMisses: 10,
    columns: 4,
    timing: blind(8),
  },
  {
    objective: msg('memory:memoryCards.levels.7'),
    challengeCount: 2,
    kind: 'near-glyphs',
    pairs: 8,
    maxMisses: 10,
    columns: 4,
    timing: blind(8),
  },
  {
    objective: msg('memory:memoryCards.levels.8'),
    challengeCount: 2,
    kind: 'near-glyphs',
    pairs: 10,
    maxMisses: 12,
    columns: 5,
    timing: blind(10),
  },
  {
    objective: msg('memory:memoryCards.levels.9'),
    challengeCount: 2,
    kind: 'near-glyphs',
    pairs: 10,
    maxMisses: 9,
    columns: 5,
    timing: blind(10),
  },
  {
    objective: msg('memory:memoryCards.levels.10'),
    challengeCount: 2,
    kind: 'near-glyphs',
    pairs: 12,
    maxMisses: 11,
    columns: 6,
    timing: blind(12),
  },
]);
