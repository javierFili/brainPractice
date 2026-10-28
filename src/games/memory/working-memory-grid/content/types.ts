import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export interface WorkingGridContent {
  /**
   * `last-k`: mark the cells of the last `depth` lights (running memory: the stream length is not
   * known in advance). `n-back`: point at the light shown `depth` steps before the last one.
   */
  readonly kind: 'last-k' | 'n-back';
  /** The grid is size × size; cells are numbered row by row from 0. */
  readonly size: number;
  /** Lit cells in presentation order; never the same cell twice in a row. */
  readonly stream: readonly number[];
  readonly depth: number;
  /** Time each light takes (lit half, dark half). */
  readonly itemMs: number;
}

export type WorkingGridChallenge = Challenge<'memory', WorkingGridContent>;

export interface WorkingGridProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<WorkingGridContent['kind'], number>>>;
  readonly size: number;
  /** sequenceLength: the stream length is drawn from this range for every challenge. */
  readonly stream: readonly [min: number, max: number];
  /** memoryLoad: lights to keep for `last-k`. */
  readonly lastK: number;
  /** Steps back for `n-back`. */
  readonly nBack: number;
  readonly itemMs: number;
}
