import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { SequenceRecallProfile } from './types';

const study = (length: number, itemMs: number) =>
  untimed(length * 1500 + 3000, length * itemMs + 800);

/**
 * Span grows from 3 to 9 items while each item is shown for less time. From level 4 some
 * sequences must be repeated backwards (holding and reversing, not just holding), and later
 * levels mix palettes and allow repeated symbols.
 */
export const SEQUENCE_RECALL_LEVELS = defineLevels<SequenceRecallProfile>([
  {
    objective: msg('memory:sequenceRecall.levels.1'),
    challengeCount: 5,
    kinds: { forward: 1 },
    palette: 'colors',
    length: 3,
    paletteSize: 4,
    itemMs: 1100,
    repeats: false,
    timing: study(3, 1100),
  },
  {
    objective: msg('memory:sequenceRecall.levels.2'),
    challengeCount: 5,
    kinds: { forward: 1 },
    palette: 'colors',
    length: 4,
    paletteSize: 5,
    itemMs: 1000,
    repeats: false,
    timing: study(4, 1000),
  },
  {
    objective: msg('memory:sequenceRecall.levels.3'),
    challengeCount: 5,
    kinds: { forward: 1 },
    palette: 'shapes',
    length: 4,
    paletteSize: 6,
    itemMs: 1000,
    repeats: true,
    timing: study(4, 1000),
  },
  {
    objective: msg('memory:sequenceRecall.levels.4'),
    challengeCount: 6,
    kinds: { forward: 3, backward: 1 },
    palette: 'digits',
    length: 5,
    paletteSize: 9,
    itemMs: 900,
    repeats: false,
    timing: study(5, 900),
  },
  {
    objective: msg('memory:sequenceRecall.levels.5'),
    challengeCount: 6,
    kinds: { forward: 1, backward: 1 },
    palette: 'shapes',
    length: 5,
    paletteSize: 8,
    itemMs: 850,
    repeats: true,
    timing: study(5, 850),
  },
  {
    objective: msg('memory:sequenceRecall.levels.6'),
    challengeCount: 6,
    kinds: { forward: 1, backward: 1 },
    palette: 'digits',
    length: 6,
    paletteSize: 9,
    itemMs: 800,
    repeats: true,
    timing: study(6, 800),
  },
  {
    objective: msg('memory:sequenceRecall.levels.7'),
    challengeCount: 6,
    kinds: { forward: 1, backward: 1 },
    palette: 'mixed',
    length: 6,
    paletteSize: 9,
    itemMs: 750,
    repeats: true,
    timing: study(6, 750),
  },
  {
    objective: msg('memory:sequenceRecall.levels.8'),
    challengeCount: 6,
    kinds: { forward: 1, backward: 1 },
    palette: 'mixed',
    length: 7,
    paletteSize: 10,
    itemMs: 700,
    repeats: true,
    timing: study(7, 700),
  },
  {
    objective: msg('memory:sequenceRecall.levels.9'),
    challengeCount: 6,
    kinds: { forward: 1, backward: 2 },
    palette: 'digits',
    length: 8,
    paletteSize: 9,
    itemMs: 650,
    repeats: true,
    timing: study(8, 650),
  },
  {
    objective: msg('memory:sequenceRecall.levels.10'),
    challengeCount: 6,
    kinds: { forward: 1, backward: 2 },
    palette: 'mixed',
    length: 9,
    paletteSize: 12,
    itemMs: 600,
    repeats: true,
    timing: study(9, 600),
  },
]);
