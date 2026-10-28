import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export interface SustainedAttentionContent {
  /** `single`: press for every target letter; `sequence`: only for the target right after the cue. */
  readonly kind: 'single' | 'sequence';
  /** Letters shown one at a time; never the same letter twice in a row. */
  readonly stream: readonly string[];
  readonly target: string;
  /** Letter that must come right before the target (sequence only). */
  readonly cue: string | null;
  /** How long each letter stays on screen (≥ 700 ms). */
  readonly itemMs: number;
}

export type SustainedAttentionChallenge = Challenge<'attention', SustainedAttentionContent>;

export interface SustainedAttentionProfile extends DifficultyProfile {
  readonly kind: SustainedAttentionContent['kind'];
  /** sequenceLength: letters in the stream. */
  readonly length: number;
  readonly targets: number;
  /** distractors: lures (target without cue, cue without target, look-alike letters). */
  readonly lures: number;
  /** Fillers include letters that resemble the target (K, Y for X). */
  readonly lookalikes: boolean;
  readonly itemMs: number;
  /** Errors (misses + wrong presses) tolerated over the whole stream. */
  readonly maxErrors: number;
}
