import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/** Arms and centre of a number cross; the centre of the last cross is the unknown. */
export interface NumberCross {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
  readonly centre: number | null;
}

export type NumberPatternContent =
  | {
      /** 3×3 grid whose rows or columns follow one rule; exactly one cell is null. */
      readonly kind: 'grid';
      readonly cells: readonly (readonly (number | null)[])[];
    }
  | {
      /** Rows from the top brick down; null bricks are blank. `ask` is the brick marked "?". */
      readonly kind: 'pyramid';
      readonly rows: readonly (readonly (number | null)[])[];
      readonly ask: readonly [row: number, index: number];
    }
  | {
      /** Segments clockwise from the top; exactly one is null. */
      readonly kind: 'wheel';
      readonly segments: readonly (number | null)[];
    }
  | { readonly kind: 'cross'; readonly crosses: readonly NumberCross[] };

export type NumberPatternKind = NumberPatternContent['kind'];

export type NumberPatternChallenge = Challenge<'patterns', NumberPatternContent>;

export type GridRuleName =
  | 'row-sum'
  | 'column-sum'
  | 'row-difference'
  | 'column-difference'
  | 'row-step'
  | 'column-step'
  | 'row-product'
  | 'column-product'
  | 'add-table'
  | 'row-total'
  | 'column-total';

export type WheelRuleName = 'opposite-sum' | 'opposite-difference' | 'clockwise-step';

export type CrossRuleName =
  'sum' | 'vertical-minus-horizontal' | 'product-sum' | 'product-difference';

export interface NumberPatternProfile extends DifficultyProfile {
  /** Layouts that may appear at this level, with relative weights. */
  readonly kinds: Readonly<Partial<Record<NumberPatternKind, number>>>;
  /** Largest starting number (operands); results can be larger. */
  readonly maxValue: number;
  readonly grid: {
    readonly rules: readonly GridRuleName[];
    /** False keeps the missing cell at the end of its row (or column), where it is easiest. */
    readonly missingAnywhere: boolean;
  };
  readonly pyramid: {
    /** Bricks in the bottom row. */
    readonly base: number;
    /** The "?" may be in the bottom row (found by subtraction). */
    readonly askBottom: boolean;
    /** Extra blank bricks that must be worked out on the way. */
    readonly blanks: number;
  };
  readonly wheel: { readonly segments: 6 | 8; readonly rules: readonly WheelRuleName[] };
  readonly cross: { readonly rules: readonly CrossRuleName[] };
}
