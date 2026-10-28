import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Glyph } from '@/games/kit/content';

export type SequenceKind = 'digits' | 'letters' | 'shapes';

/** How a distractor differs from the sequence it is built from. */
export type SequenceChange = 'substitute' | 'swap';

export interface FastSequenceContent {
  readonly kind: SequenceKind;
  /** The sequence shown in the study phase, as symbol ids. */
  readonly items: readonly string[];
  /** Shapes kind: the glyph behind each id (empty otherwise). */
  readonly glyphs: Readonly<Record<string, Glyph>>;
}

export type FastSequenceChallenge = Challenge<'speed', FastSequenceContent>;

export interface FastSequenceProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<SequenceKind, number>>>;
  readonly length: number;
  readonly optionCount: number;
  /** `swap` only = every option has the same symbols, only their order differs. */
  readonly changes: readonly SequenceChange[];
}
