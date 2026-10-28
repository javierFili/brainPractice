import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export interface PositionMemoryContent {
  /**
   * `plain`: remember every lit cell. `filtered`: cells light up in two colours; remember only the
   * blue ones and ignore the orange distractors.
   */
  readonly kind: 'plain' | 'filtered';
  /** The grid is size × size; cells are numbered row by row from 0. */
  readonly size: number;
  readonly targets: readonly number[];
  /** Cells lit in the distractor colour (filtered only). */
  readonly distractors: readonly number[];
}

export type PositionMemoryChallenge = Challenge<'memory', PositionMemoryContent>;

export interface PositionMemoryProfile extends DifficultyProfile {
  readonly kind: PositionMemoryContent['kind'];
  readonly size: number;
  /** memoryLoad: cells to remember. */
  readonly targets: number;
  readonly distractors: number;
}
