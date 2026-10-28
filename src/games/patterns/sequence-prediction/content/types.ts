import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Figure } from '../../shared/content';

export interface Mark {
  /** A single shape (count 1); arrows also show a direction. */
  readonly figure: Figure;
  readonly row: number;
  readonly col: number;
}

export interface Frame {
  readonly marks: readonly Mark[];
}

export interface SequencePredictionContent {
  /**
   * `move`: a mark moves by the same step each frame. `rotate`: an arrow turns by the same step.
   * `move-rotate`: both at once. `two-marks`: two marks, each with its own step.
   */
  readonly kind: 'move' | 'rotate' | 'move-rotate' | 'two-marks';
  /** Frames are size × size grids. */
  readonly size: number;
  /** Marks leaving one edge come back on the opposite edge. */
  readonly wrap: boolean;
  readonly frames: readonly Frame[];
}

export type SequencePredictionChallenge = Challenge<'patterns', SequencePredictionContent>;

export interface SequencePredictionProfile extends DifficultyProfile {
  readonly kind: SequencePredictionContent['kind'];
  readonly size: number;
  readonly wrap: boolean;
  /** Largest move per frame along a row or column (diagonals when both are non-zero). */
  readonly maxStep: number;
  readonly diagonal: boolean;
  /** In two-marks frames, whether the second mark is an arrow that also turns. */
  readonly turning: boolean;
  /** sequenceLength: frames shown. */
  readonly frames: number;
  readonly options: number;
}
