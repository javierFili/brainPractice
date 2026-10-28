import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { ColorName, Glyph, ShapeKind } from '@/games/kit/content';

export type GlyphRule =
  | { readonly type: 'color'; readonly color: ColorName }
  | { readonly type: 'shape'; readonly shape: ShapeKind }
  | { readonly type: 'not-color'; readonly color: ColorName }
  | { readonly type: 'not-shape'; readonly shape: ShapeKind }
  | { readonly type: 'color-or-shape'; readonly color: ColorName; readonly shape: ShapeKind };

export type NumberTest =
  | { readonly type: 'even' }
  | { readonly type: 'odd' }
  | { readonly type: 'multiple'; readonly of: number }
  | { readonly type: 'greater'; readonly than: number }
  | { readonly type: 'less'; readonly than: number }
  | { readonly type: 'ends-in'; readonly digit: number };

export type NumberRule =
  NumberTest | { readonly type: 'and'; readonly a: NumberTest; readonly b: NumberTest };

export type GlyphFamily = GlyphRule['type'];
export type NumberFamily = 'parity' | 'multiple' | 'greater' | 'less' | 'ends-in' | 'and';

export type RuleContent =
  | {
      readonly kind: 'glyphs';
      readonly rule: GlyphRule;
      readonly fits: readonly Glyph[];
      readonly misses: readonly Glyph[];
    }
  | {
      readonly kind: 'numbers';
      readonly rule: NumberRule;
      readonly fits: readonly number[];
      readonly misses: readonly number[];
    };

export type RuleChallenge = Challenge<'logic', RuleContent>;

export interface RuleProfile extends DifficultyProfile {
  readonly glyph: {
    /** Families the hidden rule is drawn from (empty = no glyph puzzles). */
    readonly hidden: readonly GlyphFamily[];
    /** Every alternative rule the examples must rule out (or agree with on the options). */
    readonly considered: readonly GlyphFamily[];
  };
  readonly number: {
    readonly hidden: readonly NumberFamily[];
    readonly considered: readonly NumberFamily[];
  };
  /** Share of number puzzles (vs glyph puzzles) when both are available. */
  readonly numberShare: number;
  /** Labelled examples on each side: fewer examples leave fewer hints. */
  readonly examples: number;
  readonly options: number;
}
