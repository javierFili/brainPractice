import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Mark } from '../../shared/content';

export type Swap = readonly [number, number];

export interface TargetTrackingContent {
  /** `single`: follow one card; `double`: follow two, then you are asked about one of them. */
  readonly kind: 'single' | 'double';
  /** The card that starts in each position (shown face up before being covered). */
  readonly items: readonly Mark[];
  /** Starting positions of the cards to follow. */
  readonly followed: readonly number[];
  /** Starting position of the card asked about at the end (one of `followed`). */
  readonly asked: number;
  /** Position pairs exchanged, in order. */
  readonly swaps: readonly Swap[];
  /** How long each swap is shown (arrow, then a pause). */
  readonly stepMs: number;
  /** How long the cards stay face up before being covered. */
  readonly revealMs: number;
}

export type TargetTrackingChallenge = Challenge<'attention', TargetTrackingContent>;

export interface TargetTrackingProfile extends DifficultyProfile {
  readonly kind: TargetTrackingContent['kind'];
  readonly slots: number;
  readonly swaps: number;
  readonly stepMs: number;
}
