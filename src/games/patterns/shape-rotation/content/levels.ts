import { defineLevels, untimed } from '@/games/kit/content';
import type { ShapeRotationProfile } from './types';

/**
 * From telling a turned piece apart from different pieces, to telling a turn from a flip (mirror
 * pairs), with bigger pieces and look-alikes that differ by a single square.
 */
export const SHAPE_ROTATION_LEVELS = defineLevels<ShapeRotationProfile>([
  {
    objective: 'Find the same piece, turned, among different pieces.',
    challengeCount: 5,
    cells: 5,
    pairs: 0,
    others: 2,
    near: false,
    timing: untimed(12_000),
  },
  {
    objective: 'Tell a turned piece from its mirror image.',
    challengeCount: 5,
    cells: 5,
    pairs: 2,
    others: 0,
    near: false,
    timing: untimed(16_000),
  },
  {
    objective: 'Mirror images and pieces that differ by one square.',
    challengeCount: 6,
    cells: 5,
    pairs: 2,
    others: 0,
    near: true,
    timing: untimed(18_000),
  },
  {
    objective: 'Bigger 6-square pieces.',
    challengeCount: 6,
    cells: 6,
    pairs: 2,
    others: 0,
    near: false,
    timing: untimed(20_000),
  },
  {
    objective: '6-square pieces that differ by one square.',
    challengeCount: 6,
    cells: 6,
    pairs: 2,
    others: 0,
    near: true,
    timing: untimed(22_000),
  },
  {
    objective: '6-square pieces among six options.',
    challengeCount: 6,
    cells: 6,
    pairs: 3,
    others: 0,
    near: false,
    timing: untimed(24_000),
  },
  {
    objective: '6-square look-alikes that differ by one square.',
    challengeCount: 6,
    cells: 6,
    pairs: 3,
    others: 0,
    near: true,
    timing: untimed(26_000),
  },
  {
    objective: 'Large 7-square pieces.',
    challengeCount: 6,
    cells: 7,
    pairs: 3,
    others: 0,
    near: false,
    timing: untimed(28_000),
  },
  {
    objective: '7-square look-alikes that differ by one square.',
    challengeCount: 6,
    cells: 7,
    pairs: 3,
    others: 0,
    near: true,
    timing: untimed(30_000),
  },
  {
    objective: 'Eight options: four 7-square look-alikes and their mirror images.',
    challengeCount: 6,
    cells: 7,
    pairs: 4,
    others: 0,
    near: true,
    timing: untimed(32_000),
  },
]);
