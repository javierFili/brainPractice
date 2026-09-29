import type { Seed } from '../random/seed';
import type { CognitiveArea } from '../shared/cognitiveArea';
import type { DifficultyLevel } from '../shared/difficultyLevel';
import type { ChallengeId, GameId } from '../shared/ids';
import type { ProgrammingSkill } from '../shared/programmingSkill';
import type { Response } from './responseFormats';

/** Game-specific content shown to the player, discriminated by `kind`. */
export interface ChallengeContent {
  readonly kind: string;
}

export interface ChallengeTiming {
  /** Memorisation phase before the content is hidden (Memory); null when there is none. */
  readonly studyMs: number | null;
  /** Hard response limit, enforced by the session; null when untimed. */
  readonly limitMs: number | null;
  /** Expected response time, used by the speed bonus and adaptive difficulty. */
  readonly targetMs: number;
}

/** Fields that identify where a challenge comes from; computed once by the generation pipeline. */
export interface ChallengeIdentity<A extends CognitiveArea = CognitiveArea> {
  readonly id: ChallengeId;
  readonly gameId: GameId;
  readonly area: A;
  readonly level: DifficultyLevel;
  readonly seed: Seed;
}

/**
 * A single playable item. Games specialise it with their own area and content union, e.g.
 * `type LogicChallenge = Challenge<'logic', LogicContent>`; the concrete union of all games is
 * assembled in `games/`, so adding a game never touches the domain.
 */
export interface Challenge<
  A extends CognitiveArea = CognitiveArea,
  C extends ChallengeContent = ChallengeContent,
> extends ChallengeIdentity<A> {
  readonly prompt: string;
  readonly content: C;
  readonly response: Response;
  /** Why the solution is correct; shown as feedback after answering. */
  readonly explanation: string;
  readonly skills: readonly ProgrammingSkill[];
  readonly timing: ChallengeTiming;
}
