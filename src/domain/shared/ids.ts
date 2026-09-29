import type { Seed } from '../random/seed';
import type { DifficultyLevel } from './difficultyLevel';
import { DomainError } from './errors';

declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

export type GameId = Brand<string, 'GameId'>;
export type ChallengeId = Brand<string, 'ChallengeId'>;

const GAME_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export class InvalidGameIdError extends DomainError {
  constructor(value: string) {
    super('INVALID_GAME_ID', `Game id must be kebab-case, got "${value}"`);
  }
}

export function gameIdOf(value: string): GameId {
  if (!GAME_ID_PATTERN.test(value)) throw new InvalidGameIdError(value);
  return value as GameId;
}

/** `gameId:level:seed` — a challenge id fully identifies how to regenerate it. */
export const challengeIdOf = (gameId: GameId, level: DifficultyLevel, seed: Seed): ChallengeId =>
  `${gameId}:${level}:${seed}` as ChallengeId;
