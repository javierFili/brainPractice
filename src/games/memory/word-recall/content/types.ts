import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export interface WordRecallContent {
  /**
   * `recognise`: find the studied words on a board with new words from any theme. `similar`: the
   * new words share themes with the studied ones (kitchen words among kitchen words). `order`:
   * put the studied words back in the order they were shown.
   */
  readonly kind: 'recognise' | 'similar' | 'order';
  /** Words in presentation order. */
  readonly studied: readonly string[];
  /** Recognition board (studied + new words); empty for `order`. */
  readonly board: readonly string[];
  readonly itemMs: number;
}

export type WordRecallChallenge = Challenge<'memory', WordRecallContent>;

export interface WordRecallVariant {
  readonly kind: WordRecallContent['kind'];
  /** memoryLoad: words shown. */
  readonly words: number;
  /** elementCount: words on the board (recognition kinds). */
  readonly board: number;
  /** Themes the words come from (`similar` only). */
  readonly themes: number;
  /** Mistakes tolerated on the board (missed + wrong marks). Zero means mark exactly. */
  readonly maxErrors: number;
}

export interface WordRecallProfile extends DifficultyProfile {
  /** One is picked uniformly per challenge. */
  readonly variants: readonly WordRecallVariant[];
  /** How long each word stays on screen. */
  readonly itemMs: number;
}
