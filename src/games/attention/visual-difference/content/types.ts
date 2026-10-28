import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Change, Mark } from '../../shared/content';

export interface VisualDifferenceContent {
  /** `plain`: colour and shape differences; `oriented`: turns and mirrored L shapes as well. */
  readonly kind: 'plain' | 'oriented';
  readonly columns: number;
  readonly left: readonly Mark[];
  /** Same as `left` except at the differing cells. */
  readonly right: readonly Mark[];
}

export type VisualDifferenceChallenge = Challenge<'attention', VisualDifferenceContent>;

export interface VisualDifferenceProfile extends DifficultyProfile {
  readonly columns: number;
  /** Number of differing cells. */
  readonly differences: number;
  readonly changes: readonly Change[];
  /** How many distinct marks the picture is made of (more = busier picture). */
  readonly palette: number;
  readonly subtle: boolean;
}
