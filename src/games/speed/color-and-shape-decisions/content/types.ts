import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { ColorName, Glyph, ShapeKind } from '@/games/kit/content';

/** The feature the cue asks for in this trial. */
export type Dimension = 'colour' | 'shape';

/**
 * How answers map to keys. `single`: one rule per level, options are that feature's values.
 * `separate`: both rules mixed, colour and shape each have their own options. `shared`: each key
 * means one colour *and* one shape ("red / circle"), so a red square needs the cue to answer.
 */
export type ResponseMapping = 'single' | 'separate' | 'shared';

/** A colour and a shape that share an answer key in the `shared` mapping. */
export interface ValuePair {
  readonly color: ColorName;
  readonly shape: ShapeKind;
}

export interface ColorShapeContent {
  readonly kind: Dimension;
  readonly mapping: ResponseMapping;
  readonly glyph: Glyph;
  readonly pairs: readonly ValuePair[];
  /** Colour and shape belong to the same pair (both rules point at the same key). */
  readonly congruent: boolean;
}

export type ColorShapeChallenge = Challenge<'speed', ColorShapeContent>;

export interface ColorShapeProfile extends DifficultyProfile {
  readonly mapping: ResponseMapping;
  readonly pairs: readonly ValuePair[];
  /**
   * Probability that a trial uses the shape rule. Trials are generated independently, so the
   * closer this is to 0.5 the more often the rule changes from one trial to the next
   * (expected switch rate 2·p·(1 − p)): rule mixing is how "switch frequency" rises here.
   */
  readonly shapeShare: number;
  /** Share of trials whose colour and shape point to different keys. */
  readonly incongruentShare: number;
}
