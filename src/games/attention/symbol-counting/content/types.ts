import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Change, Mark } from '../../shared/content';

export interface SymbolCountingContent {
  /** `plain`: unrelated fillers; `lookalike`: fillers differ in one feature; `oriented`: by direction. */
  readonly kind: 'plain' | 'lookalike' | 'oriented';
  readonly columns: number;
  readonly items: readonly Mark[];
  readonly target: Mark;
}

export type SymbolCountingChallenge = Challenge<'attention', SymbolCountingContent>;

export interface SymbolCountingProfile extends DifficultyProfile {
  readonly columns: number;
  readonly rows: number;
  readonly minTargets: number;
  readonly maxTargets: number;
  /** Look-alike fillers differ from the target in one of these features; empty = unrelated fillers. */
  readonly lures: readonly Change[];
  /** distractors: share of fillers that are look-alikes. */
  readonly lureShare: number;
  readonly subtle: boolean;
}
