import { msg } from '@/domain/shared';
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
    objective: msg('speed:colorAndShapeDecisions.levels.1'),
    mapping: 'single',
    pairs: TWO,
    shapeShare: 0,
    incongruentShare: 0.3,
    challengeCount: 10,
    timing: timed(1800, 5000),
  },
  {
    objective: msg('speed:colorAndShapeDecisions.levels.2'),
    mapping: 'single',
    pairs: TWO,
    shapeShare: 1,
    incongruentShare: 0.3,
    challengeCount: 10,
    timing: timed(1800, 4500),
  },
  {
    objective: msg('speed:colorAndShapeDecisions.levels.3'),
    mapping: 'separate',
    pairs: TWO,
    shapeShare: 0.25,
    incongruentShare: 0.3,
    challengeCount: 12,
    timing: timed(2200, 4500),
  },
  {
    objective: msg('speed:colorAndShapeDecisions.levels.4'),
    mapping: 'separate',
    pairs: TWO,
    shapeShare: 0.5,
    incongruentShare: 0.3,
    challengeCount: 12,
    timing: timed(2200, 4200),
  },
  {
    objective: msg('speed:colorAndShapeDecisions.levels.5'),
    mapping: 'shared',
    pairs: TWO,
    shapeShare: 0.35,
    incongruentShare: 0.3,
    challengeCount: 14,
    timing: timed(2200, 4200),
  },
  {
    objective: msg('speed:colorAndShapeDecisions.levels.6'),
    mapping: 'shared',
    pairs: TWO,
    shapeShare: 0.5,
    incongruentShare: 0.5,
    challengeCount: 14,
    timing: timed(2100, 4000),
  },
  {
    objective: msg('speed:colorAndShapeDecisions.levels.7'),
    mapping: 'shared',
    pairs: TWO,
    shapeShare: 0.5,
    incongruentShare: 0.7,
    challengeCount: 16,
    timing: timed(2000, 3800),
  },
  {
    objective: msg('speed:colorAndShapeDecisions.levels.8'),
    mapping: 'shared',
    pairs: THREE,
    shapeShare: 0.5,
    incongruentShare: 0.7,
    challengeCount: 16,
    timing: timed(2300, 3800),
  },
  {
    objective: msg('speed:colorAndShapeDecisions.levels.9'),
    mapping: 'shared',
    pairs: THREE,
    shapeShare: 0.5,
    incongruentShare: 0.75,
    challengeCount: 18,
    timing: timed(2200, 3500),
  },
  {
    objective: msg('speed:colorAndShapeDecisions.levels.10'),
    mapping: 'shared',
    pairs: THREE,
    shapeShare: 0.5,
    incongruentShare: 0.8,
    challengeCount: 20,
    timing: timed(2100, 3200),
  },
]);
