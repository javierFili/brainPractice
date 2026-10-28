import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Figure } from '../../shared/content';

export interface VisualPatternContent {
  /**
   * `repeat`: a block of figures repeats (AB, ABC, AABB…). `two-rules`: shapes and colours repeat
   * on cycles of different lengths. `growing`: a count or a direction changes by the same step each
   * time, alongside repeating features.
   */
  readonly kind: 'repeat' | 'two-rules' | 'growing';
  /** The row shown, left to right; the next figure is the answer. */
  readonly items: readonly Figure[];
}

export type VisualPatternChallenge = Challenge<'patterns', VisualPatternContent>;

export interface VisualPatternProfile extends DifficultyProfile {
  readonly kind: VisualPatternContent['kind'];
  /** repeat: the repeating blocks allowed (letters stand for figures). */
  readonly units: readonly string[];
  /** two-rules / growing: cycle lengths allowed for shapes and colours (0 = constant). */
  readonly shapePeriods: readonly number[];
  readonly colorPeriods: readonly number[];
  /** growing: which feature changes step by step. */
  readonly growth: 'none' | 'count' | 'rotation';
  /** repeat: the row may start in the middle of the block. */
  readonly offset: boolean;
  /** sequenceLength: figures shown (raised when a rule needs two full cycles). */
  readonly shown: number;
  /** Options to choose from (answer included). */
  readonly options: number;
}
