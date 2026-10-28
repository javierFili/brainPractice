import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Glyph } from '@/games/kit/content';

export type CardFace =
  | { readonly type: 'object'; readonly objectId: string }
  | { readonly type: 'glyph'; readonly glyph: Glyph };

export interface MemoryCardsContent {
  /**
   * `objects`: everyday objects from different families; `family`: objects of one family (closer
   * faces); `glyphs`: coloured shapes; `near-glyphs`: shapes that come in look-alike couples
   * (same shape, different colour or the reverse), so each face must be remembered exactly.
   */
  readonly kind: 'objects' | 'family' | 'glyphs' | 'near-glyphs';
  /** One face per card, in board order; each face appears exactly twice. */
  readonly faces: readonly CardFace[];
  readonly columns: number;
}

export type MemoryCardsChallenge = Challenge<'memory', MemoryCardsContent>;

export interface MemoryCardsProfile extends DifficultyProfile {
  readonly kind: MemoryCardsContent['kind'];
  /** elementCount: number of pairs on the board. */
  readonly pairs: number;
  /** Mismatched turns allowed before the board counts as unsolved. */
  readonly maxMisses: number;
  readonly columns: number;
}
