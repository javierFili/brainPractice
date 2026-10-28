import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export type Theme = 'ages' | 'marbles';

/** Facts about hidden whole numbers, one per person. `flip` only changes the wording. */
export type Fact =
  | { readonly type: 'value'; readonly a: number; readonly v: number }
  /** value(a) = value(b) + k, with k > 0. */
  | {
      readonly type: 'diff';
      readonly a: number;
      readonly b: number;
      readonly k: number;
      readonly flip: boolean;
    }
  /** value(a) = k × value(b). */
  | {
      readonly type: 'times';
      readonly a: number;
      readonly b: number;
      readonly k: number;
      readonly flip: boolean;
    }
  | { readonly type: 'sum'; readonly people: readonly number[]; readonly total: number };

export type Question =
  | { readonly type: 'value'; readonly a: number }
  | { readonly type: 'difference'; readonly a: number; readonly b: number }
  | { readonly type: 'most' | 'least' };

/** "a is taller than b". */
export interface Comparison {
  readonly a: number;
  readonly b: number;
}

export type MultiStepContent =
  | {
      readonly kind: 'numbers';
      readonly theme: Theme;
      readonly names: readonly string[];
      readonly facts: readonly Fact[];
      readonly question: Question;
      readonly solution: readonly number[];
    }
  | {
      readonly kind: 'compare';
      readonly names: readonly string[];
      readonly comparisons: readonly Comparison[];
      readonly question: 'most' | 'least';
      /** Heights rank: higher = taller (one order consistent with the clues). */
      readonly solution: readonly number[];
    };

export type MultiStepKind = MultiStepContent['kind'];

export type MultiStepChallenge = Challenge<'logic', MultiStepContent>;

export interface MultiStepProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<MultiStepKind, number>>>;
  /** People in the puzzle. */
  readonly people: number;
  readonly relations: readonly ('diff' | 'times')[];
  /** How the numbers are pinned down: one known value, a total, or nothing (order questions). */
  readonly anchors: readonly ('value' | 'sum' | 'none')[];
  readonly questions: readonly Question['type'][];
  readonly maxValue: number;
}
