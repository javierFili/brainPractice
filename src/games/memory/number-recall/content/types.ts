import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/** A labelled number shown in chunks, e.g. Phone: 482 6193. Every chunk starts with 1–9. */
export interface ChunkedNumber {
  readonly label: string;
  readonly groups: readonly string[];
}

export interface NumberRecallContent {
  /**
   * `type-back`: type the whole number. `which-group`: pick the chunk that came in a given
   * position. `two-numbers`: two labelled numbers are shown; type back the one that is asked.
   */
  readonly kind: 'type-back' | 'which-group' | 'two-numbers';
  readonly numbers: readonly ChunkedNumber[];
  /** Which number is asked about, and (which-group only) which chunk, 0-based. */
  readonly ask: { readonly number: number; readonly group: number | null };
}

export type NumberRecallChallenge = Challenge<'memory', NumberRecallContent>;

export interface NumberRecallVariant {
  readonly kind: NumberRecallContent['kind'];
  /** Digits per chunk of each number (two-numbers shows two numbers of this shape). */
  readonly groups: readonly number[];
}

export interface NumberRecallProfile extends DifficultyProfile {
  /** One is picked uniformly per challenge. */
  readonly variants: readonly NumberRecallVariant[];
}
