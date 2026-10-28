import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export const DIRECTIONS = ['left', 'right', 'up', 'down'] as const;
export type Direction = (typeof DIRECTIONS)[number];

/** A row element: an arrow, or a neutral bar that points nowhere. */
export type RowItem = Direction | 'none';

/**
 * `single`: one arrow alone. `flanker`: the centre arrow among flankers that agree, disagree or
 * are neutral bars. `cued`: as flanker, but a cue says whether to answer the CENTRE arrow or the
 * OUTER arrows (all outer arrows always agree with each other).
 */
export type FlankerKind = 'single' | 'flanker' | 'cued';

export type FlankerRule = 'centre' | 'outer';

export type Congruence = 'congruent' | 'incongruent' | 'neutral';

export interface FlankerContent {
  readonly kind: FlankerKind;
  readonly rule: FlankerRule;
  readonly row: readonly RowItem[];
  readonly congruence: Congruence;
  /**
   * Horizontal jitter: the row occupies slots [start, start + row.length) of a track of `track`
   * slots, so where the centre lands is not fully predictable (standard in flanker tasks).
   */
  readonly track: number;
  readonly start: number;
}

export type FlankerChallenge = Challenge<'speed', FlankerContent>;

export interface FlankerProfile extends DifficultyProfile {
  readonly kind: FlankerKind;
  /** 2 (left/right) or 4 (plus up/down). */
  readonly directionCount: 2 | 4;
  /** Arrows in the row (1, 5 or 7). */
  readonly rowLength: number;
  /** Share of trials whose flankers point another way than the centre. */
  readonly incongruentShare: number;
  /** Share of the remaining trials with neutral bars as flankers (centre rule only). */
  readonly neutralShare: number;
  /** Cued levels: probability of the OUTER rule. */
  readonly outerShare: number;
}
