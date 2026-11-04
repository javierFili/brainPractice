import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { ShapeRotationProfile } from './types';

/**
 * From telling a turned piece apart from different pieces, to telling a turn from a flip (mirror
 * pairs), with bigger pieces and look-alikes that differ by a single square.
 */
export const SHAPE_ROTATION_LEVELS = defineLevels<ShapeRotationProfile>([
  {
    objective: msg('patterns:shapeRotation.levels.1'),
    challengeCount: 5,
    cells: 5,
    pairs: 0,
    others: 2,
    near: false,
    timing: untimed(12_000),
  },
  {
    objective: msg('patterns:shapeRotation.levels.2'),
    challengeCount: 5,
    cells: 5,
    pairs: 2,
    others: 0,
    near: false,
    timing: untimed(16_000),
  },
  {
    objective: msg('patterns:shapeRotation.levels.3'),
    challengeCount: 6,
    cells: 5,
    pairs: 2,
    others: 0,
    near: true,
    timing: untimed(18_000),
  },
  {
    objective: msg('patterns:shapeRotation.levels.4'),
    challengeCount: 6,
    cells: 6,
    pairs: 2,
    others: 0,
    near: false,
    timing: untimed(20_000),
  },
  {
    objective: msg('patterns:shapeRotation.levels.5'),
    challengeCount: 6,
    cells: 6,
    pairs: 2,
    others: 0,
    near: true,
    timing: untimed(22_000),
  },
  {
    objective: msg('patterns:shapeRotation.levels.6'),
    challengeCount: 6,
    cells: 6,
    pairs: 3,
    others: 0,
    near: false,
    timing: untimed(24_000),
  },
  {
    objective: msg('patterns:shapeRotation.levels.7'),
    challengeCount: 6,
    cells: 6,
    pairs: 3,
    others: 0,
    near: true,
    timing: untimed(26_000),
  },
  {
    objective: msg('patterns:shapeRotation.levels.8'),
    challengeCount: 6,
    cells: 7,
    pairs: 3,
    others: 0,
    near: false,
    timing: untimed(28_000),
  },
  {
    objective: msg('patterns:shapeRotation.levels.9'),
    challengeCount: 6,
    cells: 7,
    pairs: 3,
    others: 0,
    near: true,
    timing: untimed(30_000),
  },
  {
    objective: msg('patterns:shapeRotation.levels.10'),
    challengeCount: 6,
    cells: 7,
    pairs: 4,
    others: 0,
    near: true,
    timing: untimed(32_000),
  },
]);
