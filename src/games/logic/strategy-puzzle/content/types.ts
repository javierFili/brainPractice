import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export type StrategyContent =
  | {
      /** One pile; each turn a player takes 1 to `maxTake` coins; taking the last coin wins. */
      readonly kind: 'take-away';
      readonly pile: number;
      readonly maxTake: number;
    }
  | {
      /** Several piles; take any number of coins from one pile; taking the last coin wins. */
      readonly kind: 'piles';
      readonly piles: readonly number[];
    }
  | {
      readonly kind: 'jugs';
      readonly capacities: readonly number[];
      readonly start: readonly number[];
      /** With a tap, jugs can be filled and emptied; without, water can only be poured. */
      readonly tap: boolean;
      readonly target: number;
    }
  | {
      readonly kind: 'sliding';
      readonly rows: number;
      readonly cols: number;
      /** Row by row; 0 is the gap. */
      readonly start: readonly number[];
      readonly goal: readonly number[];
    };

export type StrategyKind = StrategyContent['kind'];

export type StrategyChallenge = Challenge<'logic', StrategyContent>;

export interface StrategyProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<StrategyKind, number>>>;
  readonly takeAway: { readonly maxTake: number; readonly pile: readonly [number, number] };
  readonly piles: { readonly count: number; readonly max: number };
  readonly jugs: { readonly count: 2 | 3; readonly moves: readonly [number, number] };
  readonly sliding: {
    readonly rows: number;
    readonly cols: number;
    readonly moves: readonly [number, number];
  };
}
