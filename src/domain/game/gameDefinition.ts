import type { Challenge, ChallengeIdentity } from '../challenge/challenge';
import type { DifficultyProfile, LevelTable } from '../difficulty/difficultyProfile';
import type { RandomGenerator } from '../random/RandomGenerator';
import type { ScoringConfig } from '../scoring/scoring';
import type { GameId } from '../shared/ids';
import type { Skill } from '../shared/skill';
import type { GameMeta } from './catalog';

export interface GenerationParams<C extends Challenge, P extends DifficultyProfile> {
  /** Pre-computed identity; generators spread it into the challenge instead of rebuilding it. */
  readonly identity: ChallengeIdentity<C['area']>;
  readonly profile: P;
  /** Already seeded with `identity.seed`; the only source of randomness allowed. */
  readonly random: RandomGenerator;
}

/** A game as pure data + a generator. Knows nothing about rendering. */
export interface GameDefinition<
  C extends Challenge = Challenge,
  P extends DifficultyProfile = DifficultyProfile,
> {
  readonly id: GameId;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly area: C['area'];
  readonly skills: readonly Skill[];
  /** Catalog placement, audiences, interaction and result semantics. */
  readonly meta: GameMeta;
  readonly instructions: readonly string[];
  /** One-sentence version of the instructions for short-attention routes (kids, quick play). */
  readonly simpleInstructions?: string;
  readonly levels: LevelTable<P>;
  /** Partial override of the default scoring constants (e.g. Speed weighs time more). */
  readonly scoring?: Partial<ScoringConfig>;
  // Method syntax on purpose: lets specific games be stored as `GameDefinition` in the registry.
  generate(params: GenerationParams<C, P>): C;
}
