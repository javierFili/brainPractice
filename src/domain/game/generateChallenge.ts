import type { Challenge } from '../challenge/challenge';
import { validateChallenge } from '../challenge/validateChallenge';
import type { DifficultyProfile } from '../difficulty/difficultyProfile';
import { mulberry32 } from '../random/mulberry32';
import { toSeed } from '../random/seed';
import type { DifficultyLevel } from '../shared/difficultyLevel';
import { DomainError } from '../shared/errors';
import { challengeIdOf } from '../shared/ids';
import type { GameDefinition } from './gameDefinition';

export class ChallengeGenerationError extends DomainError {
  constructor(
    readonly challengeId: string,
    readonly issues: readonly string[],
  ) {
    super(
      'INVALID_CHALLENGE',
      `Generated challenge ${challengeId} is invalid: ${issues.join('; ')}`,
    );
  }
}

export interface GenerateOptions {
  readonly level: DifficultyLevel;
  /** Any uint32; the same (game, level, seed) always yields the same challenge. */
  readonly seed: number;
}

/**
 * The only entry point to challenge generation: seeds the RNG, runs the game's generator and
 * rejects invalid output loudly instead of letting a broken challenge reach a player.
 */
export function generateChallenge<C extends Challenge, P extends DifficultyProfile>(
  game: GameDefinition<C, P>,
  { level, seed }: GenerateOptions,
): C {
  const validSeed = toSeed(seed);
  const identity = {
    id: challengeIdOf(game.id, level, validSeed),
    gameId: game.id,
    area: game.area,
    level,
    seed: validSeed,
  };
  const challenge = game.generate({
    identity,
    profile: game.levels[level],
    random: mulberry32(validSeed),
  });

  const issues = validateChallenge(challenge);
  for (const key of ['id', 'gameId', 'area', 'level', 'seed'] as const) {
    if (challenge[key] !== identity[key])
      issues.push(`${key} does not match the requested identity`);
  }
  if (issues.length > 0) throw new ChallengeGenerationError(identity.id, issues);
  return challenge;
}
