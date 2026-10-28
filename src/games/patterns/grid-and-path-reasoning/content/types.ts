import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export interface GridPathContent {
  /**
   * `shortest-length`: count the steps of the shortest route from start to goal. `reachable-exit`:
   * only one lettered exit can be reached from the start. `must-pass`: every shortest route passes
   * through exactly one of the numbered cells.
   */
  readonly kind: 'shortest-length' | 'reachable-exit' | 'must-pass';
  /** The maze is size × size; cells are numbered row by row from 0. */
  readonly size: number;
  readonly walls: readonly number[];
  readonly start: number;
  /** Null for `reachable-exit`. */
  readonly goal: number | null;
  /** `reachable-exit`: exit cells, labelled A, B, C… in this order. */
  readonly exits: readonly number[];
  /** `must-pass`: candidate cells, labelled 1, 2, 3… in this order. */
  readonly marks: readonly number[];
}

export type GridPathChallenge = Challenge<'patterns', GridPathContent>;

export interface GridPathProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<GridPathContent['kind'], number>>>;
  readonly size: number;
  /** Share of cells that are walls (visualNoise). */
  readonly density: number;
  /** Shortest route (in steps) between start and goal, at least. */
  readonly minDistance: number;
  /** Extra steps the walls force beyond the straight-line (row + column) distance, at least. */
  readonly detour: number;
  readonly exits: number;
  readonly marks: number;
  /** must-pass: there must be several shortest routes (so not every cell on one is a must). */
  readonly multiplePaths: boolean;
}
