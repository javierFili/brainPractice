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
    objective: 'Follow one card through 2 swaps of 3 cards.',
    challengeCount: 5,
    kind: 'single',
    slots: 3,
    swaps: 2,
    stepMs: 2000,
    timing: watch(2, 2000),
  },
  {
    objective: 'Follow one card through 3 swaps.',
    challengeCount: 5,
    kind: 'single',
    slots: 3,
    swaps: 3,
    stepMs: 1800,
    timing: watch(3, 1800),
  },
  {
    objective: 'Four cards, 4 swaps.',
    challengeCount: 5,
    kind: 'single',
    slots: 4,
    swaps: 4,
    stepMs: 1800,
    timing: watch(4, 1800),
  },
  {
    objective: 'Four cards, 5 quicker swaps.',
    challengeCount: 5,
    kind: 'single',
    slots: 4,
    swaps: 5,
    stepMs: 1600,
    timing: watch(5, 1600),
  },
  {
    objective: 'Five cards, 5 swaps.',
    challengeCount: 5,
    kind: 'single',
    slots: 5,
    swaps: 5,
    stepMs: 1500,
    timing: watch(5, 1500),
  },
  {
    objective: 'Five cards, 6 swaps.',
    challengeCount: 5,
    kind: 'single',
    slots: 5,
    swaps: 6,
    stepMs: 1400,
    timing: watch(6, 1400),
  },
  {
    objective: 'Follow two cards at once: you will be asked about one.',
    challengeCount: 5,
    kind: 'double',
    slots: 5,
    swaps: 6,
    stepMs: 1400,
    timing: watch(6, 1400),
  },
  {
    objective: 'Two cards through 7 swaps.',
    challengeCount: 5,
    kind: 'double',
    slots: 5,
    swaps: 7,
    stepMs: 1300,
    timing: watch(7, 1300),
  },
  {
    objective: 'Two cards among 6, 8 swaps.',
    challengeCount: 5,
    kind: 'double',
    slots: 6,
    swaps: 8,
    stepMs: 1200,
    timing: watch(8, 1200),
  },
  {
    objective: 'Two cards among 6, 10 swaps at a brisk pace.',
    challengeCount: 5,
    kind: 'double',
    slots: 6,
    swaps: 10,
    stepMs: 1000,
    timing: watch(10, 1000),
  },
]);
