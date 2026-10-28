import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { TileGrid } from '../../shared/content';

export type SymmetryClass = 'left-right' | 'top-bottom' | 'both' | 'none';
export type Axis = 'vertical' | 'horizontal';

export type SymmetryContent =
  | {
      /** Say which mirror lines the pattern has. */
      readonly kind: 'classify';
      readonly grid: TileGrid;
    }
  | {
      /**
       * Complete the mirror image. `vertical`: `given` is the left half and the player fills the
       * right half; `horizontal`: `given` is the top half and the player fills the bottom half.
       * Cells of the half to fill are numbered row by row from 0.
       */
      readonly kind: 'complete';
      readonly axis: Axis;
      readonly given: TileGrid;
    };

export type SymmetryChallenge = Challenge<'patterns', SymmetryContent>;

export interface SymmetryProfile extends DifficultyProfile {
  readonly kind: SymmetryContent['kind'];
  /** Whole grid size. For `complete`, the halves are rows × cols/2 or rows/2 × cols. */
  readonly rows: number;
  readonly cols: number;
  /** classify: the answers offered (the class is drawn uniformly among them). */
  readonly classes: readonly SymmetryClass[];
  /** classify: 0 = non-symmetric patterns are random; n = a symmetric pattern with n cells changed. */
  readonly breaks: number;
  /** classify: tile kinds used (1 = filled/empty only). */
  readonly tiles: number;
  /** complete: mirror lines that may be used. */
  readonly axes: readonly Axis[];
  /** complete: the number of cells to mark is announced. */
  readonly announceCount: boolean;
}
