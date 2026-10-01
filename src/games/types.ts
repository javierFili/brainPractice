import type { ComponentType } from 'react';
import type { Challenge } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';

/** What part of a challenge is visible: memorisation, answering, or reviewing after the answer. */
export type ChallengePhase = 'study' | 'respond' | 'review';

/** Interaction for the `locate` response format, rendered by the game's own content view. */
export interface LocateBinding {
  readonly disabled: boolean;
  readonly selectedIndex: number | null;
  /** Revealed once the challenge is answered. */
  readonly solutionIndex: number | null;
  onLocate(index: number): void;
}

export interface ContentViewProps<C extends Challenge = Challenge> {
  readonly challenge: C;
  readonly phase: ChallengePhase;
  readonly locate: LocateBinding | null;
}

/** A game = pure definition (domain) + how its content looks (React). */
export interface GameModule<C extends Challenge = Challenge> {
  readonly definition: GameDefinition<C>;
  readonly ContentView: ComponentType<ContentViewProps<C>>;
  /** Human labels for each content kind (results breakdown). */
  readonly kindLabels: Readonly<Record<C['content']['kind'], string>>;
  /** Words for option labels that are not readable aloud (e.g. symbol strings). */
  readonly describeOption?: (label: string) => string | undefined;
}

/**
 * Erases the challenge type so heterogeneous modules share one list. Sound because a module's
 * ContentView only ever receives challenges produced by its own definition.
 */
export const defineGameModule = <C extends Challenge>(module: GameModule<C>): GameModule =>
  module as unknown as GameModule;
