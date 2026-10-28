import { defineLevels, timed } from '@/games/kit/content';
import type { ColorShapeProfile, ValuePair } from './types';

/** Red, blue and yellow stay apart for the common colour-vision differences (no red/green). */
const TWO: readonly ValuePair[] = [
  { color: 'red', shape: 'circle' },
  { color: 'blue', shape: 'square' },
];
const THREE: readonly ValuePair[] = [...TWO, { color: 'yellow', shape: 'triangle' }];

/**
 * One rule at a time → both rules mixed with separate keys → shared keys where conflicting
 * (incongruent) stimuli need the cue → more conflict, three values per feature, tighter limits.
 */
export const COLOR_SHAPE_LEVELS = defineLevels<ColorShapeProfile>([
  {
    objective: 'Colour only: say the colour of each shape.',
    mapping: 'single',
    pairs: TWO,
    shapeShare: 0,
    incongruentShare: 0.3,
    challengeCount: 10,
    timing: timed(1800, 5000),
  },
  {
    objective: 'Shape only: say the shape, whatever its colour.',
    mapping: 'single',
    pairs: TWO,
    shapeShare: 1,
    incongruentShare: 0.3,
    challengeCount: 10,
    timing: timed(1800, 4500),
  },
  {
    objective: 'Follow the cue: COLOUR or SHAPE, each with its own answers.',
    mapping: 'separate',
    pairs: TWO,
    shapeShare: 0.25,
    incongruentShare: 0.3,
    challengeCount: 12,
    timing: timed(2200, 4500),
  },
  {
    objective: 'Cued rules, mixed half and half.',
    mapping: 'separate',
    pairs: TWO,
    shapeShare: 0.5,
    incongruentShare: 0.3,
    challengeCount: 12,
    timing: timed(2200, 4200),
  },
  {
    objective: 'Shared keys: each answer means a colour and a shape.',
    mapping: 'shared',
    pairs: TWO,
    shapeShare: 0.35,
    incongruentShare: 0.3,
    challengeCount: 14,
    timing: timed(2200, 4200),
  },
  {
    objective: 'Shared keys, rules mixed half and half, more conflicting shapes.',
    mapping: 'shared',
    pairs: TWO,
    shapeShare: 0.5,
    incongruentShare: 0.5,
    challengeCount: 14,
    timing: timed(2100, 4000),
  },
  {
    objective: 'Most shapes now conflict: colour and shape point to different keys.',
    mapping: 'shared',
    pairs: TWO,
    shapeShare: 0.5,
    incongruentShare: 0.7,
    challengeCount: 16,
    timing: timed(2000, 3800),
  },
  {
    objective: 'Three colours and three shapes.',
    mapping: 'shared',
    pairs: THREE,
    shapeShare: 0.5,
    incongruentShare: 0.7,
    challengeCount: 16,
    timing: timed(2300, 3800),
  },
  {
    objective: 'Three values, more conflict, less time.',
    mapping: 'shared',
    pairs: THREE,
    shapeShare: 0.5,
    incongruentShare: 0.75,
    challengeCount: 18,
    timing: timed(2200, 3500),
  },
  {
    objective: 'Master: three values, nearly every shape conflicts, short limit.',
    mapping: 'shared',
    pairs: THREE,
    shapeShare: 0.5,
    incongruentShare: 0.8,
    challengeCount: 20,
    timing: timed(2100, 3200),
  },
]);
