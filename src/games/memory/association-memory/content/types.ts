import type { Challenge } from '@/domain/challenge';
import type { ColorName, Glyph } from '@/games/kit/content';

import type { DifficultyProfile } from '@/domain/difficulty';

/** One side of a pair. Every item has a spoken label (object name, colour, glyph, word, number). */
export type AssocItem =
  | { readonly type: 'object'; readonly id: string }
  | { readonly type: 'color'; readonly color: ColorName }
  | { readonly type: 'glyph'; readonly glyph: Glyph }
  | { readonly type: 'word'; readonly word: string }
  | { readonly type: 'number'; readonly value: number };

export interface AssocPair {
  readonly cue: AssocItem;
  readonly partner: AssocItem;
}

export interface AssociationContent {
  /** What is paired with what: object ↔ colour, shape ↔ object, or word ↔ number. */
  readonly kind: 'object-color' | 'glyph-object' | 'word-number';
  /** Pairs in study order. */
  readonly pairs: readonly AssocPair[];
  /** The pair asked about; `reversed` asks from the partner back to the cue. */
  readonly ask: { readonly pair: number; readonly reversed: boolean };
}

export type AssociationChallenge = Challenge<'memory', AssociationContent>;

export interface AssociationProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<AssociationContent['kind'], number>>>;
  /** memoryLoad: pairs to learn. */
  readonly pairs: number;
  /** Look-alike items: objects of one family, near-identical shapes, numbers sharing digits. */
  readonly similar: boolean;
  /** Probability of asking in the reverse direction (partner → cue). */
  readonly reversedShare: number;
  /** alternatives: answer options (capped by the number of pairs). */
  readonly options: number;
}
