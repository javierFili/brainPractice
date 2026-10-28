import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { ColorName, ShapeKind } from '@/games/kit/content';
import type { Mark } from '../../shared/content';

/** `shape`: every item of one shape; `color`: every item of one colour; `conjunction`: both. */
export type FilterKind = 'shape' | 'color' | 'conjunction';

export interface DistractorFilteringContent {
  readonly kind: FilterKind;
  readonly columns: number;
  readonly items: readonly Mark[];
  readonly target: { readonly shape: ShapeKind; readonly color: ColorName };
}

export type DistractorFilteringChallenge = Challenge<'attention', DistractorFilteringContent>;

export interface DistractorFilteringProfile extends DifficultyProfile {
  readonly kind: FilterKind;
  readonly columns: number;
  readonly rows: number;
  readonly targets: number;
  /** distractors: share of non-targets that share one feature with the target (0–1). */
  readonly similarity: number;
  /** Lures use the nearest colour / outline (purple next to blue, heart next to triangle). */
  readonly near: boolean;
  /** Announce how many targets there are. */
  readonly exact: boolean;
  readonly maxErrors: number;
}
