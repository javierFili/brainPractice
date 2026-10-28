import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/** What the numbers look like; the comparison is always exact. */
export type NumberKind = 'integers' | 'decimals' | 'fractions' | 'expressions';

export const KIND_ORDER: readonly NumberKind[] = [
  'integers',
  'decimals',
  'fractions',
  'expressions',
];

/** A displayed quantity and its exact value as a fraction num/den (den > 0). */
export interface Quantity {
  readonly label: string;
  readonly num: number;
  readonly den: number;
}

export interface NumberComparisonContent {
  readonly kind: NumberKind;
  /** Which extreme to pick. */
  readonly ask: 'largest' | 'smallest';
  readonly items: readonly Quantity[];
}

export type NumberComparisonChallenge = Challenge<'speed', NumberComparisonContent>;

export interface NumberComparisonProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<NumberKind, number>>>;
  /** How many numbers to compare (2–4). */
  readonly optionCount: number;
  /** Digits of the integers. */
  readonly digits: number;
  /**
   * Closeness in [0, 1]: 0 = values far apart, 1 = values as close as the kind allows (integers
   * sharing leading digits, decimals within the same tenth, fractions within 1/4).
   */
  readonly closeness: number;
  /** Probability of asking for the smallest instead of the largest. */
  readonly smallestShare: number;
}
