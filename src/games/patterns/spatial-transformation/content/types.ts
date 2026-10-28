import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { TileGrid } from '../../shared/content';

/** The moves a player can be asked to apply. */
export type Step = 'cw' | 'ccw' | '180' | 'flip-lr' | 'flip-ud';

export interface SpatialTransformContent {
  /** `single`: one move. `double`: two moves, applied in the order shown. */
  readonly kind: 'single' | 'double';
  readonly grid: TileGrid;
  readonly steps: readonly Step[];
}

export type SpatialTransformChallenge = Challenge<'patterns', SpatialTransformContent>;

export interface SpatialTransformProfile extends DifficultyProfile {
  /** The pattern is size × size. */
  readonly size: number;
  /** Tile kinds (1 = filled/empty only). */
  readonly tiles: number;
  readonly moves: readonly Step[];
  /** Moves combined in one challenge. */
  readonly stepCount: 1 | 2;
  /** Options to choose from (answer included); up to all 8 turned/flipped versions. */
  readonly options: number;
}
