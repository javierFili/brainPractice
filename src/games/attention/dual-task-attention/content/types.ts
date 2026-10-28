import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { ColorName, ShapeKind } from '@/games/kit/content';
import type { Mark } from '../../shared/content';

export type NumberRule = 'even' | 'odd' | 'above';

export interface DualItem {
  readonly number: number;
  readonly mark: Mark;
}

export interface DualTaskContent {
  /** `parity`: count even/odd numbers; `threshold`: count numbers above a value. */
  readonly kind: 'parity' | 'threshold';
  readonly items: readonly DualItem[];
  readonly numberRule: NumberRule;
  /** Only for `above`. */
  readonly threshold: number;
  readonly shape: ShapeKind;
  /** When set, only shapes of this colour count. */
  readonly color: ColorName | null;
  readonly itemMs: number;
}

export type DualTaskChallenge = Challenge<'attention', DualTaskContent>;

export interface DualTaskProfile extends DifficultyProfile {
  readonly numberRule: NumberRule;
  readonly twoDigits: boolean;
  /** The shape count also requires a colour (blue stars). */
  readonly shapeColor: boolean;
  /** Non-target shapes include close outlines (cross next to star). */
  readonly lookalikes: boolean;
  /** sequenceLength: pairs shown. */
  readonly length: number;
  readonly itemMs: number;
  /** Gap between the two candidate values of each count in the options (2 = easier). */
  readonly spacing: number;
}
