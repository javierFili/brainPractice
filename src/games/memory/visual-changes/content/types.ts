import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Glyph } from '@/games/kit/content';

export interface VisualChangesContent {
  /** `color` / `shape`: one item changed that feature. `swap`: two different items traded places. */
  readonly kind: 'color' | 'shape' | 'swap';
  /** The grid is size × size; cells are numbered row by row from 0, null when empty. */
  readonly size: number;
  readonly before: readonly (Glyph | null)[];
  readonly after: readonly (Glyph | null)[];
  /** Cells that differ between `before` and `after` (one, or two for a swap). */
  readonly changed: readonly number[];
}

export type VisualChangesChallenge = Challenge<'memory', VisualChangesContent>;

export interface VisualChangesProfile extends DifficultyProfile {
  readonly size: number;
  /** elementCount: glyphs on the grid. */
  readonly items: number;
  /**
   * `distinct`: every glyph differs in shape and colour where possible (changes stand out).
   * `similar`: glyphs come from three shapes × three colours, so a changed item looks like others.
   */
  readonly palette: 'distinct' | 'similar';
  readonly kinds: Readonly<Partial<Record<VisualChangesContent['kind'], number>>>;
}
