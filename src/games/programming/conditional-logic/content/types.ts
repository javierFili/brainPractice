import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Variables } from '@/domain/pseudocode';

/**
 * `branch`: a flat if / elif / else chain; `nested`: ifs inside ifs; `find-input`: which input
 * reaches a given output; `short-circuit`: conditions where the order of `and` / `or` decides
 * whether a division by zero is ever evaluated.
 */
export type ConditionalKind = 'branch' | 'nested' | 'find-input' | 'short-circuit';

/** Condition ingredients, in roughly increasing difficulty. */
export type ConditionPart = 'compare' | 'and' | 'or' | 'not' | 'flag' | 'mixed';

export interface ConditionalContent {
  readonly kind: ConditionalKind;
  /** Program shown to the player. For find-input it has no input lines (the options are inputs). */
  readonly source: string;
  /** Input values the program starts from (already written as its first lines); null for find-input. */
  readonly inputs: Variables | null;
  /** The output asked about in find-input; null otherwise. */
  readonly target: string | null;
}

export type ConditionalChallenge = Challenge<'logic', ConditionalContent>;

export interface ConditionalProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<ConditionalKind, number>>>;
  /** decisionCount: outcomes of the chain (including else). */
  readonly outcomes: number;
  /** Number inputs (x, then y). */
  readonly numberInputs: 1 | 2;
  readonly parts: readonly ConditionPart[];
}
