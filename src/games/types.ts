import type { ComponentType, ReactNode } from 'react';
import type { Answer, Challenge, ChoiceOption } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import type { Text } from '@/domain/shared';

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
  /**
   * Submits an answer from inside the content (grids, cards, reaction stages). Non-null only while
   * the response window is open; the session evaluates the answer, never the view.
   */
  readonly respond: ((answer: Answer) => void) | null;
  /** The answer given, once the challenge is answered (review phase); null otherwise. */
  readonly answer: Answer | null;
  /** Relaxed timing: views that pace their own presentation should slow it down. */
  readonly assisted: boolean;
}

/** A game = pure definition (domain) + how its content looks (React). */
export interface GameModule<C extends Challenge = Challenge> {
  readonly definition: GameDefinition<C>;
  readonly ContentView: ComponentType<ContentViewProps<C>>;
  /** Human labels for each content kind (results breakdown). */
  readonly kindLabels: Readonly<Record<C['content']['kind'], Text>>;
  /** Words for option labels that are not readable aloud (e.g. symbol strings). */
  readonly describeOption?: (label: string) => Text | undefined;
  /**
   * Visual face for an option or sequence symbol (e.g. a coloured shape). The label is still
   * used as its accessible name. Return undefined to show the label as text.
   */
  readonly renderOption?: (option: ChoiceOption) => ReactNode;
}

/**
 * Erases the challenge type so heterogeneous modules share one list. Sound because a module's
 * ContentView only ever receives challenges produced by its own definition.
 */
export const defineGameModule = <C extends Challenge>(module: GameModule<C>): GameModule =>
  module as unknown as GameModule;
