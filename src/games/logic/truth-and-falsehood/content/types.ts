import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/** What one character says; indices are characters. */
export type Claim =
  | { readonly type: 'is'; readonly target: number; readonly honest: boolean }
  | { readonly type: 'same' | 'different'; readonly a: number; readonly b: number }
  | {
      readonly type: 'count';
      readonly op: 'at-least' | 'exactly' | 'at-most';
      readonly k: number;
      /** Counting truth-tellers (true) or liars (false). */
      readonly honest: boolean;
    }
  /** "At least one of X and Y is a liar" (or truth-teller). */
  | { readonly type: 'either'; readonly a: number; readonly b: number; readonly honest: boolean };

export type ClaimType = Claim['type'];

export type Ask = 'one' | 'who' | 'count';

export interface TruthContent {
  readonly kind: Ask;
  readonly names: readonly string[];
  /** claims[i] is what character i says. */
  readonly claims: readonly Claim[];
  /** honest[i]: character i always tells the truth. */
  readonly solution: readonly boolean[];
  /** For `one`: the character asked about. */
  readonly target: number;
}

export type TruthChallenge = Challenge<'logic', TruthContent>;

export interface TruthProfile extends DifficultyProfile {
  readonly characters: number;
  readonly claimTypes: Readonly<Partial<Record<ClaimType, number>>>;
  readonly asks: Readonly<Partial<Record<Ask, number>>>;
}
