import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Glyph } from '@/games/kit/content';

/**
 * `feature`: every distractor is one glyph of the target's colour with another shape (pop-out by
 * shape, no colour needed). `similar`: the same, with a look-alike shape. `conjunction`: each
 * distractor shares either the colour or the shape of the target, so only the combination of
 * both features singles it out.
 */
export type SearchKind = 'feature' | 'similar' | 'conjunction';

export interface SearchContent {
  readonly kind: SearchKind;
  readonly target: Glyph;
  /** Grid cells in reading order; exactly one equals `target`. */
  readonly cells: readonly Glyph[];
  readonly columns: number;
}

export type VisualSearchChallenge = Challenge<'speed', SearchContent>;

export interface VisualSearchProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<SearchKind, number>>>;
  /** elementCount: cells in the grid (target included). */
  readonly setSize: number;
  /** At most 6, so the grid fits a 360 px screen. */
  readonly columns: number;
  /** Conjunction distractors that differ in shape use a look-alike shape. */
  readonly lookAlikeConjunction: boolean;
}
