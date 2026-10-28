import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { TileGrid } from '../../shared/content';

export interface ShapeRotationContent {
  /**
   * `pieces`: the wrong options are different pieces. `mirrors`: every piece shown also appears as
   * its mirror image, so only turning (never flipping) the reference decides.
   */
  readonly kind: 'pieces' | 'mirrors';
  /** The reference piece, cropped to its cells (1 = filled). */
  readonly piece: TileGrid;
}

export type ShapeRotationChallenge = Challenge<'patterns', ShapeRotationContent>;

export interface ShapeRotationProfile extends DifficultyProfile {
  /** elementCount: squares per piece. */
  readonly cells: number;
  /** Mirror pairs among the options (0 = no mirror images, different pieces only). */
  readonly pairs: number;
  /** With `pairs` = 0: how many different pieces join the answer. */
  readonly others: number;
  /** Pieces that differ by moving a single square (closer look-alikes). */
  readonly near: boolean;
}
