import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { SequenceProfile } from './types';

/**
 * Rules get harder in kind, not just in size: constant steps → multiplying → alternating steps →
 * growing steps → two interleaved sequences → two-step rules → sums of earlier terms; missing
 * middle terms and decreasing steps arrive from level 4.
 */
export const NUMBER_SEQUENCES_LEVELS = defineLevels<SequenceProfile>([
  {
    objective: msg('logic:numberSequences.levels.1'),
    challengeCount: 5,
    timing: untimed(20_000),
    rules: { add: 1 },
    missingShare: 0,
    maxValue: 99,
    negativeSteps: false,
  },
  {
    objective: msg('logic:numberSequences.levels.2'),
    challengeCount: 5,
    timing: untimed(25_000),
    rules: { add: 1 },
    missingShare: 0,
    maxValue: 120,
    negativeSteps: true,
  },
  {
    objective: msg('logic:numberSequences.levels.3'),
    challengeCount: 5,
    timing: untimed(30_000),
    rules: { add: 1, multiply: 1 },
    missingShare: 0,
    maxValue: 999,
    negativeSteps: false,
  },
  {
    objective: msg('logic:numberSequences.levels.4'),
    challengeCount: 5,
    timing: untimed(35_000),
    rules: { add: 1, multiply: 1 },
    missingShare: 0.6,
    maxValue: 999,
    negativeSteps: true,
  },
  {
    objective: msg('logic:numberSequences.levels.5'),
    challengeCount: 5,
    timing: untimed(45_000),
    rules: { add: 1, 'alternating-add': 2 },
    missingShare: 0.4,
    maxValue: 999,
    negativeSteps: true,
  },
  {
    objective: msg('logic:numberSequences.levels.6'),
    challengeCount: 5,
    timing: untimed(50_000),
    rules: { 'alternating-add': 1, 'growing-add': 2 },
    missingShare: 0.4,
    maxValue: 999,
    negativeSteps: true,
  },
  {
    objective: msg('logic:numberSequences.levels.7'),
    challengeCount: 5,
    timing: untimed(55_000),
    rules: { 'growing-add': 1, interleaved: 2 },
    missingShare: 0.4,
    maxValue: 999,
    negativeSteps: true,
  },
  {
    objective: msg('logic:numberSequences.levels.8'),
    challengeCount: 5,
    timing: untimed(60_000),
    rules: { interleaved: 1, 'two-step': 2, multiply: 1 },
    missingShare: 0.5,
    maxValue: 999,
    negativeSteps: true,
  },
  {
    objective: msg('logic:numberSequences.levels.9'),
    challengeCount: 5,
    timing: untimed(65_000),
    rules: { 'sum-of-two': 2, 'two-step': 1, 'growing-add': 1 },
    missingShare: 0.5,
    maxValue: 999,
    negativeSteps: true,
  },
  {
    objective: msg('logic:numberSequences.levels.10'),
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
