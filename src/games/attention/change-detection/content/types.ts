import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Mark } from '../../shared/content';

/** What can change between the two looks; `none` labels the trials where nothing changed. */
export type SceneChange = 'appear' | 'move' | 'color' | 'shape' | 'turn';

export interface ChangeDetectionContent {
  readonly kind: SceneChange | 'none';
  readonly columns: number;
  /** Cells of the first look (null = empty), row by row. */
  readonly before: readonly (Mark | null)[];
  /** Cells of the second look; identical to `before` on no-change trials. */
  readonly after: readonly (Mark | null)[];
  /** Blank interval between the two looks. */
  readonly gapMs: number;
}

export type ChangeDetectionChallenge = Challenge<'attention', ChangeDetectionContent>;

export interface ChangeDetectionProfile extends DifficultyProfile {
  readonly columns: number;
  readonly rows: number;
  readonly items: number;
  readonly changes: readonly SceneChange[];
  readonly subtle: boolean;
  readonly gapMs: number;
}
