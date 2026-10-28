import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import { generateChallenge, type GameDefinition } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/domain/shared';

/** Test-only helpers shared by the speed games. */

/** Every level × `seeds` seeds, with the generated challenge. */
export function sweep<C extends Challenge, P extends DifficultyProfile>(
  game: GameDefinition<C, P>,
  seeds = 40,
): { level: DifficultyLevel; seed: number; challenge: C }[] {
  return DIFFICULTY_LEVELS.flatMap((level) =>
    Array.from({ length: seeds }, (_, seed) => ({
      level,
      seed,
      challenge: generateChallenge(game, { level, seed: toSeed(seed + 1) }),
    })),
  );
}

/** Mean generation time in ms per challenge across all levels (budget: < 5 ms). */
export function meanGenerationMs<C extends Challenge, P extends DifficultyProfile>(
  game: GameDefinition<C, P>,
  seeds = 30,
): number {
  const start = performance.now();
  const count = sweep(game, seeds).length;
  return (performance.now() - start) / count;
}
