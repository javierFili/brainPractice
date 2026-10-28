import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export interface ObjectRecallContent {
  /**
   * `mixed`: new objects come from any family. `family`: studied and new objects are drawn from
   * the same few families, so a new object often resembles a studied one (a pear next to an apple).
   */
  readonly kind: 'mixed' | 'family';
  /** Object ids shown during study, in display order. */
  readonly studied: readonly string[];
  /** Object ids on the recognition board, in board order (studied + new). */
  readonly board: readonly string[];
  readonly columns: number;
}

export type ObjectRecallChallenge = Challenge<'memory', ObjectRecallContent>;

export interface ObjectRecallProfile extends DifficultyProfile {
  readonly kind: ObjectRecallContent['kind'];
  /** memoryLoad: objects to study. */
  readonly studied: number;
  /** elementCount: objects on the recognition board. */
  readonly board: number;
  /** Families the objects come from (family kind only). */
  readonly families: number;
  readonly columns: number;
}
