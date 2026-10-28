import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { TileGrid } from '../../shared/content';
import type { RuleFamily } from './rules';

export interface GridExample {
  readonly input: TileGrid;
  readonly output: TileGrid;
}

export interface RuleDiscoveryContent {
  /** Family of the hidden rule; `two-step` chains two rules. */
  readonly kind: RuleFamily | 'two-step';
  readonly examples: readonly GridExample[];
  readonly question: TileGrid;
  /** How many changes the hidden rule chains (1 or 2), as told to the player. */
  readonly steps: 1 | 2;
}

export type RuleDiscoveryChallenge = Challenge<'patterns', RuleDiscoveryContent>;

export interface RuleDiscoveryProfile extends DifficultyProfile {
  /** Families the hidden rule is drawn from (first step for two-step rules). */
  readonly families: readonly RuleFamily[];
  /** Families for the second step; empty for one-step rules. */
  readonly secondFamilies: readonly RuleFamily[];
  readonly size: number;
  /** Different tile kinds used in the grids. */
  readonly tileKinds: number;
  /** Examples shown first; more are added (up to maxExamples) until only one rule fits. */
  readonly minExamples: number;
  readonly maxExamples: number;
  readonly options: number;
}
