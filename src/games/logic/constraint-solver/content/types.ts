import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/** value(smaller) < value(larger); the two cells are side by side or one above the other. */
export interface Inequality {
  readonly smaller: number;
  readonly larger: number;
}

export interface GridPuzzle {
  readonly size: number;
  /** Box height × width (mini sudoku), or null for a plain Latin square. */
  readonly box: readonly [number, number] | null;
  /** Row by row; null = empty cell. */
  readonly givens: readonly (number | null)[];
  readonly inequalities: readonly Inequality[];
}

export interface ConstraintContent extends GridPuzzle {
  readonly kind: 'latin' | 'boxes' | 'inequalities';
  /** The highlighted cell whose value is asked. */
  readonly asked: number;
  readonly solution: readonly number[];
}

export type ConstraintChallenge = Challenge<'logic', ConstraintContent>;

export interface ConstraintProfile extends DifficultyProfile {
  readonly size: number;
  readonly box: readonly [number, number] | null;
  /** Share of cells left filled in (before removal stops at uniqueness). */
  readonly givenShare: number;
  readonly inequalities: number;
}
