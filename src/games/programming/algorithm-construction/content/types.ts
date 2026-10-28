import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/** `order-blocks`: use every block; `spare-block`: one block is not needed and goes last. */
export type ConstructionKind = 'order-blocks' | 'spare-block';

export interface CodeBlockPiece {
  /** Same id as the matching ordering item. */
  readonly id: string;
  /** One or more lines; loop blocks keep their indented body. */
  readonly code: string;
}

export interface ConstructionContent {
  readonly kind: ConstructionKind;
  /** Blocks in the order they are first shown (same as the ordering items). */
  readonly blocks: readonly CodeBlockPiece[];
  /** Output the finished program must print, one entry per printed line. */
  readonly target: readonly string[];
  /** Number of orders the generator ran (or ruled out) to prove the answer unique. */
  readonly ordersChecked: number;
}

export type ConstructionChallenge = Challenge<'logic', ConstructionContent>;

export interface ConstructionProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<ConstructionKind, number>>>;
  /** complexity: blocks the finished program uses. */
  readonly blockCount: number;
  /** Loop blocks among them (0–3). */
  readonly loops: number;
  /** Variables the straight-line blocks share. */
  readonly variableCount: number;
}
