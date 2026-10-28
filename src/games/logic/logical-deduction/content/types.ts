import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export type CategoryId = 'pet' | 'colour' | 'drink' | 'hobby';

/** A clue about the hidden table. Values are indices into the category's `values`. */
export type DeductionClue =
  | {
      readonly type: 'is';
      readonly person: number;
      readonly category: number;
      readonly value: number;
    }
  | {
      readonly type: 'is-not';
      readonly person: number;
      readonly category: number;
      readonly value: number;
    }
  | {
      readonly type: 'either';
      readonly person: number;
      readonly category: number;
      readonly values: readonly [number, number];
    }
  /** The person with value `a` (in category `catA`) also has (or has not) value `b` in `catB`. */
  | {
      readonly type: 'link' | 'not-link';
      readonly catA: number;
      readonly a: number;
      readonly catB: number;
      readonly b: number;
    };

export type ClueType = DeductionClue['type'];

export interface DeductionContent {
  readonly kind: 'single-category' | 'multi-category';
  readonly people: readonly string[];
  readonly categories: readonly { readonly id: CategoryId; readonly values: readonly string[] }[];
  readonly clues: readonly DeductionClue[];
  /** solution[category][person] = value index. */
  readonly solution: readonly (readonly number[])[];
  readonly question:
    | { readonly type: 'who'; readonly category: number; readonly value: number }
    | { readonly type: 'what'; readonly category: number; readonly person: number };
}

export type DeductionChallenge = Challenge<'logic', DeductionContent>;

export interface DeductionProfile extends DifficultyProfile {
  /** elementCount: people (and values per category). */
  readonly people: number;
  /** complexity: categories to match. */
  readonly categories: number;
  /** Clue types and relative weights; fewer direct "is" clues means more deduction steps. */
  readonly clueTypes: Readonly<Partial<Record<ClueType, number>>>;
}
