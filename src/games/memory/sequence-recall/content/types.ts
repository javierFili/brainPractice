import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/** What the sequence is made of. Each palette entry has an id `<palette>:<value>`. */
export type Palette = 'colors' | 'digits' | 'shapes' | 'mixed';

export interface SequenceRecallContent {
  /** `forward`: repeat in the order shown; `backward`: repeat from last to first. */
  readonly kind: 'forward' | 'backward';
  readonly palette: Palette;
  /** Symbol ids in presentation order. */
  readonly items: readonly string[];
  /** Time each item stays on screen during the presentation. */
  readonly itemMs: number;
}

export type SequenceRecallChallenge = Challenge<'memory', SequenceRecallContent>;

export interface SequenceRecallProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<SequenceRecallContent['kind'], number>>>;
  readonly palette: Palette;
  /** sequenceLength */
  readonly length: number;
  /** alternatives: symbols offered on the answer pad. */
  readonly paletteSize: number;
  readonly itemMs: number;
  /** Whether a symbol may appear twice in a row (harder to keep apart). */
  readonly repeats: boolean;
}
