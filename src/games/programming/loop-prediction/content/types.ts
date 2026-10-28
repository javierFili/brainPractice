import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/** `iterations`: how many times a line runs; `final-value`: a variable at the end; `last-output`. */
export type LoopKind = 'iterations' | 'final-value' | 'last-output';

/** Loop shapes, introduced level by level. */
export type LoopStructure = 'simple' | 'conditional' | 'nested' | 'early-exit';

export interface LoopContent {
  readonly kind: LoopKind;
  readonly structure: LoopStructure;
  readonly source: string;
  /** Line whose executions are counted (iterations); null otherwise. */
  readonly line: number | null;
  /** Variable asked about (final-value); null otherwise. */
  readonly ask: string | null;
}

export type LoopChallenge = Challenge<'patterns', LoopContent>;

export interface LoopProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<LoopKind, number>>>;
  readonly structures: Readonly<Partial<Record<LoopStructure, number>>>;
  /** complexity: upper bound for one loop's iteration count. */
  readonly maxIterations: number;
  readonly answer: 'choice' | 'numeric';
}
