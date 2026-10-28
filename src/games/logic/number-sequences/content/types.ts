import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/** Rule families used to build sequences (a wider library is used to check uniqueness). */
export type SequenceRule =
  | 'add'
  | 'multiply'
  | 'alternating-add'
  | 'growing-add'
  | 'interleaved'
  | 'two-step'
  | 'sum-of-two';

export interface SequenceContent {
  readonly kind: SequenceRule;
  /** Terms in order; `null` marks the hidden term. */
  readonly terms: readonly (number | null)[];
  readonly hiddenIndex: number;
}

export type SequenceChallenge = Challenge<'logic', SequenceContent>;

export interface SequenceProfile extends DifficultyProfile {
  readonly rules: Readonly<Partial<Record<SequenceRule, number>>>;
  /** Share of challenges asking for a missing middle term instead of the next one. */
  readonly missingShare: number;
  /** Largest absolute value any term may take. */
  readonly maxValue: number;
  /** Allow decreasing steps and negative changes. */
  readonly negativeSteps: boolean;
}
