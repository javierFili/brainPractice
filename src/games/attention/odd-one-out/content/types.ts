import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Change, Mark } from '../../shared/content';

export interface OddOneOutContent {
  /** The feature in which the odd item differs. */
  readonly kind: Change;
  readonly columns: number;
  /** Every item but one has the same look; cells are numbered row by row from 0. */
  readonly items: readonly Mark[];
}

export type OddOneOutChallenge = Challenge<'attention', OddOneOutContent>;

export interface OddOneOutProfile extends DifficultyProfile {
  /** Which features may differ; several = a different one on each grid. */
  readonly changes: readonly Change[];
  readonly columns: number;
  readonly rows: number;
  /** Nearest colour / outline / a quarter turn instead of an obvious difference. */
  readonly subtle: boolean;
}
