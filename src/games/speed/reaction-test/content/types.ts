import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Glyph } from '@/games/kit/content';

export interface ReactionContent {
  /**
   * `simple`: tap as soon as the signal appears. `go-no-go`: tap for the go shape only.
   * `cued`: a cue at the top says which shape to tap for in this trial; tap only when it matches.
   */
  readonly kind: 'simple' | 'go-no-go' | 'cued';
  /** Shape to tap for (shown as the cue in `cued` trials and in the instructions otherwise). */
  readonly target: Glyph;
  /** What actually appears. Equal to `target` on go trials. */
  readonly stimulus: Glyph;
}

export type ReactionChallenge = Challenge<'speed', ReactionContent>;

export interface ReactionProfile extends DifficultyProfile {
  readonly kind: ReactionContent['kind'];
  /** Random foreperiod range before the signal, so it cannot be anticipated. */
  readonly delayMs: readonly [min: number, max: number];
  /** How long the signal stays; a tap must land inside it. */
  readonly windowMs: number;
  /** Share of trials that must NOT be tapped. */
  readonly noGoShare: number;
  /** No-go stimuli differ from the target by one feature only (harder to reject). */
  readonly similarNoGo: boolean;
}
