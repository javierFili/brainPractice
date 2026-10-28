import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export interface Placement {
  readonly objectId: string;
  /** Cell index, row by row from 0. */
  readonly cell: number;
}

export interface DualMemoryContent {
  /**
   * What the question probes. `where`: the cell of a named object. `which-nth`: the object shown
   * in a given turn. `which-here`: the object that sat in a marked cell. `where-nth`: the cell of
   * the object shown in a given turn (order and place together).
   */
  readonly kind: 'where' | 'which-nth' | 'which-here' | 'where-nth';
  readonly size: number;
  /** Objects in presentation order, each in its own cell. */
  readonly placements: readonly Placement[];
  /** Index (in presentation order) of the placement the question is about. */
  readonly ask: number;
  readonly itemMs: number;
}

export type DualMemoryChallenge = Challenge<'memory', DualMemoryContent>;

export interface DualMemoryProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<DualMemoryContent['kind'], number>>>;
  /** memoryLoad: objects shown. */
  readonly objects: number;
  readonly size: number;
  /** All objects from one family (harder to keep apart). */
  readonly family: boolean;
  readonly itemMs: number;
}
