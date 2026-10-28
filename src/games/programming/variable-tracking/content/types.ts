import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export type TrackingKind = 'final-value' | 'after-line' | 'largest';

/** Building blocks a program is made of (each may span several lines, e.g. a swap). */
export type TrackingOp = 'set' | 'add' | 'copy' | 'combine' | 'swap' | 'nested';

export interface TrackingContent {
  readonly kind: TrackingKind;
  /** Pseudocode run by the shared interpreter. */
  readonly source: string;
  /** Variables the question is about (the helper `temp` of a swap is never one of them). */
  readonly variables: readonly string[];
  /** Asked variable (final-value, after-line); null for `largest`. */
  readonly ask: string | null;
  /** 1-based line after which the value is asked (after-line); null otherwise. */
  readonly line: number | null;
}

export type TrackingChallenge = Challenge<'memory', TrackingContent>;

export interface TrackingProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<TrackingKind, number>>>;
  /** memoryLoad: variables to keep track of. */
  readonly variableCount: number;
  /** complexity: update blocks after the initial assignments. */
  readonly statementCount: number;
  readonly ops: readonly TrackingOp[];
  /** Value questions: pick among options, or type the exact number. */
  readonly answer: 'choice' | 'numeric';
}
