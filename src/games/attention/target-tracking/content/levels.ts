import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { TargetTrackingProfile } from './types';

export const REVEAL_MS = 2500;

const watch = (swaps: number, stepMs: number) => untimed(REVEAL_MS + swaps * stepMs + 5000);

/**
 * More cards, more swaps and a quicker (still discrete, ≥ 1 s) pace; from level 7 two cards must be
 * followed at once because the question only names one of them at the end.
 */
export const TARGET_TRACKING_LEVELS = defineLevels<TargetTrackingProfile>([
  {
    objective: msg('attention:targetTracking.levels.1'),
    challengeCount: 5,
    kind: 'single',
    slots: 3,
    swaps: 2,
    stepMs: 2000,
    timing: watch(2, 2000),
  },
  {
    objective: msg('attention:targetTracking.levels.2'),
    challengeCount: 5,
    kind: 'single',
    slots: 3,
    swaps: 3,
    stepMs: 1800,
    timing: watch(3, 1800),
  },
  {
    objective: msg('attention:targetTracking.levels.3'),
    challengeCount: 5,
    kind: 'single',
    slots: 4,
    swaps: 4,
    stepMs: 1800,
    timing: watch(4, 1800),
  },
  {
    objective: msg('attention:targetTracking.levels.4'),
    challengeCount: 5,
    kind: 'single',
    slots: 4,
    swaps: 5,
    stepMs: 1600,
    timing: watch(5, 1600),
  },
  {
    objective: msg('attention:targetTracking.levels.5'),
    challengeCount: 5,
    kind: 'single',
    slots: 5,
    swaps: 5,
    stepMs: 1500,
    timing: watch(5, 1500),
  },
  {
    objective: msg('attention:targetTracking.levels.6'),
    challengeCount: 5,
    kind: 'single',
    slots: 5,
    swaps: 6,
    stepMs: 1400,
    timing: watch(6, 1400),
  },
  {
    objective: msg('attention:targetTracking.levels.7'),
    challengeCount: 5,
    kind: 'double',
    slots: 5,
    swaps: 6,
    stepMs: 1400,
    timing: watch(6, 1400),
  },
  {
    objective: msg('attention:targetTracking.levels.8'),
    challengeCount: 5,
    kind: 'double',
    slots: 5,
    swaps: 7,
    stepMs: 1300,
    timing: watch(7, 1300),
  },
  {
    objective: msg('attention:targetTracking.levels.9'),
    challengeCount: 5,
    kind: 'double',
    slots: 6,
    swaps: 8,
    stepMs: 1200,
    timing: watch(8, 1200),
  },
  {
    objective: msg('attention:targetTracking.levels.10'),
    challengeCount: 5,
    kind: 'double',
    slots: 6,
    swaps: 10,
    stepMs: 1000,
    timing: watch(10, 1000),
  },
]);
