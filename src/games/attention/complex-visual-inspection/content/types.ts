import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { ColorName } from '@/games/kit/content';
import type { Mark, MarkShape, Rotation } from '../../shared/content';

/** Target = shape AND pose AND colour (or, when `negated`, any colour except `color`). */
export interface InspectionRule {
  readonly shape: MarkShape;
  readonly rotation: Rotation;
  readonly mirrored: boolean;
  readonly color: ColorName;
  readonly negated: boolean;
}

export interface InspectionContent {
  /** `positive`: one colour counts; `negated`: every colour but one counts. */
  readonly kind: 'positive' | 'negated';
  readonly columns: number;
  readonly items: readonly Mark[];
  readonly rule: InspectionRule;
}

export type InspectionChallenge = Challenge<'attention', InspectionContent>;

export interface InspectionProfile extends DifficultyProfile {
  readonly columns: number;
  readonly rows: number;
  readonly shapes: readonly MarkShape[];
  readonly rotations: readonly Rotation[];
  /** Colours in play. */
  readonly colors: number;
  readonly targets: number;
  /** distractors: share of non-targets that match all features but one. */
  readonly lureShare: number;
  /** Colour lures use the nearest colour. */
  readonly nearColors: boolean;
  readonly negated: boolean;
  readonly exact: boolean;
  readonly maxErrors: number;
}
