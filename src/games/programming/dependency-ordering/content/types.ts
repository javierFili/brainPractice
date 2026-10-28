import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

export type DependencyKind = 'start-first' | 'ready-next' | 'full-order' | 'valid-order' | 'cycle';

/** `[prerequisite, task]`: the task needs the prerequisite to be finished first. */
export type Need = readonly [string, string];

export interface DependencyContent {
  readonly kind: DependencyKind;
  /** What the tasks are (heading): "Monorepo build", "Kitchen prep", … */
  readonly theme: string;
  /** Tasks in a neutral (alphabetical) order. */
  readonly tasks: readonly string[];
  readonly needs: readonly Need[];
  /** Tasks already finished (ready-next); empty otherwise. */
  readonly done: readonly string[];
}

export type DependencyChallenge = Challenge<'logic', DependencyContent>;

export interface DependencyProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<DependencyKind, number>>>;
  /** elementCount */
  readonly taskCount: number;
  /** dependencyCount (after removing needs implied by others), for branching graphs. */
  readonly needCount: number;
  /** Wrong orders break exactly one need (subtle) or any number (obvious). */
  readonly subtle: boolean;
  /** Cycle questions: the closing need may reverse a listed need (false) or only an indirect chain. */
  readonly indirectCycles: boolean;
}
