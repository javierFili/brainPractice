import { defineLevels, untimed } from '@/games/kit/content';
import type { SequenceProfile } from './types';

/**
 * Rules get harder in kind, not just in size: constant steps → multiplying → alternating steps →
 * growing steps → two interleaved sequences → two-step rules → sums of earlier terms; missing
 * middle terms and decreasing steps arrive from level 4.
 */
export const NUMBER_SEQUENCES_LEVELS = defineLevels<SequenceProfile>([
  {
    objective: 'Add the same small number each time.',
    challengeCount: 5,
    timing: untimed(20_000),
    rules: { add: 1 },
    missingShare: 0,
    maxValue: 99,
    negativeSteps: false,
  },
  {
    objective: 'Steps that go up or down.',
    challengeCount: 5,
    timing: untimed(25_000),
    rules: { add: 1 },
    missingShare: 0,
    maxValue: 120,
    negativeSteps: true,
  },
  {
    objective: 'Adding or multiplying.',
    challengeCount: 5,
    timing: untimed(30_000),
    rules: { add: 1, multiply: 1 },
    missingShare: 0,
    maxValue: 999,
    negativeSteps: false,
  },
  {
    objective: 'Find a missing number in the middle.',
    challengeCount: 5,
    timing: untimed(35_000),
    rules: { add: 1, multiply: 1 },
    missingShare: 0.6,
    maxValue: 999,
    negativeSteps: true,
  },
  {
    objective: 'Two steps that take turns.',
    challengeCount: 5,
    timing: untimed(45_000),
    rules: { add: 1, 'alternating-add': 2 },
    missingShare: 0.4,
    maxValue: 999,
    negativeSteps: true,
  },
  {
    objective: 'Steps that grow each time.',
    challengeCount: 5,
    timing: untimed(50_000),
    rules: { 'alternating-add': 1, 'growing-add': 2 },
    missingShare: 0.4,
    maxValue: 999,
    negativeSteps: true,
  },
  {
    objective: 'Two sequences mixed together.',
    challengeCount: 5,
    timing: untimed(55_000),
    rules: { 'growing-add': 1, interleaved: 2 },
    missingShare: 0.4,
    maxValue: 999,
    negativeSteps: true,
  },
  {
    objective: 'Multiply, then add: two-step rules.',
    challengeCount: 5,
    timing: untimed(60_000),
    rules: { interleaved: 1, 'two-step': 2, multiply: 1 },
    missingShare: 0.5,
    maxValue: 999,
    negativeSteps: true,
  },
  {
    objective: 'Each number built from the two before it.',
    challengeCount: 5,
    timing: untimed(65_000),
    rules: { 'sum-of-two': 2, 'two-step': 1, 'growing-add': 1 },
    missingShare: 0.5,
    maxValue: 999,
    negativeSteps: true,
  },
  {
    objective: 'Any rule, often with a gap in the middle.',
    challengeCount: 6,
    timing: untimed(70_000),
    rules: {
      'alternating-add': 1,
      'growing-add': 1,
      interleaved: 1,
      'two-step': 1,
      'sum-of-two': 1,
      multiply: 1,
    },
    missingShare: 0.7,
    maxValue: 999,
    negativeSteps: true,
  },
]);
