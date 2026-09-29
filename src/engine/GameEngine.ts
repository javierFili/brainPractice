import type { DifficultyStrategy } from '@/domain/difficulty';
import { createRuleBasedDifficulty } from '@/domain/difficulty';
import { generateChallenge, type GameRegistry } from '@/domain/game';
import { deriveSeed, toSeed, type SeedSource } from '@/domain/random';
import { createStandardScoring, type ScoringConfig, type ScoringStrategy } from '@/domain/scoring';
import { createSessionState } from '@/domain/session';
import { DomainError, isDifficultyLevel, type DifficultyLevel } from '@/domain/shared';
import type { Clock } from '@/domain/time/Clock';
import { createGameSession, type GameSession } from './GameSession';

export const MAX_CHALLENGES_PER_SESSION = 100;

export class UnknownGameError extends DomainError {
  constructor(gameId: string) {
    super('UNKNOWN_GAME', `No game registered with id "${gameId}"`);
  }
}

export class InvalidSessionConfigError extends DomainError {
  constructor(message: string) {
    super('INVALID_SESSION_CONFIG', message);
  }
}

export interface SessionConfig {
  readonly gameId: string;
  readonly level: DifficultyLevel;
  /** Reproduces a previous session; a fresh seed is drawn when omitted. */
  readonly seed?: number;
  /** Defaults to the level profile's challengeCount. */
  readonly challengeCount?: number;
  readonly assisted?: boolean;
}

export interface GameEngineDependencies {
  readonly registry: GameRegistry;
  readonly clock: Clock;
  readonly seeds: SeedSource;
  readonly createScoring?: (overrides: Partial<ScoringConfig>) => ScoringStrategy;
  readonly difficulty?: DifficultyStrategy;
}

export interface GameEngine {
  startSession(config: SessionConfig): GameSession;
}

export function createGameEngine({
  registry,
  clock,
  seeds,
  createScoring = createStandardScoring,
  difficulty = createRuleBasedDifficulty(),
}: GameEngineDependencies): GameEngine {
  return {
    startSession(config) {
      const game = registry.get(config.gameId);
      if (!game) throw new UnknownGameError(config.gameId);
      if (!isDifficultyLevel(config.level)) {
        throw new InvalidSessionConfigError(`Invalid level ${String(config.level)}`);
      }
      const profile = game.levels[config.level];
      const count = config.challengeCount ?? profile.challengeCount;
      if (!Number.isInteger(count) || count < 1 || count > MAX_CHALLENGES_PER_SESSION) {
        throw new InvalidSessionConfigError(
          `challengeCount must be an integer in [1, ${MAX_CHALLENGES_PER_SESSION}]`,
        );
      }

      const seed = config.seed === undefined ? seeds.next() : toSeed(config.seed);
      const challenges = Array.from({ length: count }, (_, i) =>
        generateChallenge(game, { level: config.level, seed: deriveSeed(seed, i) }),
      );
      const state = createSessionState(
        { gameId: game.id, level: config.level, seed, assisted: config.assisted ?? false },
        challenges,
        clock.now(),
      );
      return createGameSession(state, {
        clock,
        scoring: createScoring(game.scoring ?? {}),
        difficulty,
      });
    },
  };
}
