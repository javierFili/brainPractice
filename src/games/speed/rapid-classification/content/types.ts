import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { EverydayObject, ObjectCategory } from '@/games/kit/content';

/** Which feature decides the answer: the object's group, or the first letter of its name. */
export type ClassRule = 'category' | 'letter';

export interface RapidClassificationContent {
  /**
   * `picture`: emoji and name, classify by group. `word`: the name only, classify by group.
   * `switch`: a cue says whether to classify by group or by first letter (A–M / N–Z).
   */
  readonly kind: 'picture' | 'word' | 'switch';
  readonly rule: ClassRule;
  readonly item: EverydayObject;
  readonly showPicture: boolean;
}

export type RapidClassificationChallenge = Challenge<'speed', RapidClassificationContent>;

export interface RapidClassificationProfile extends DifficultyProfile {
  readonly kind: RapidClassificationContent['kind'];
  /** The groups offered at this level, in answer-key order (fixed for the whole session). */
  readonly categories: readonly ObjectCategory[];
  readonly showPicture: boolean;
  /** Share of `switch` trials that use the first-letter rule. */
  readonly letterShare: number;
}
