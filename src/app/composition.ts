import { createGameRegistry } from '@/domain/game';
import type { Course, LearningProgressRepository } from '@/domain/learning';
import type { ProfileRepository } from '@/domain/profile';
import type { ProgressRepository } from '@/domain/progress';
import type { SeedSource } from '@/domain/random';
import type { Clock } from '@/domain/time/Clock';
import { createGameEngine, type GameEngine } from '@/engine';
import type { GameModule } from '@/games/types';
import type { Persistence } from '@/infrastructure/browserStorage';

export interface AppServices {
  readonly engine: GameEngine;
  readonly clock: Clock;
  readonly modules: readonly GameModule[];
  readonly progress: ProgressRepository;
  readonly course: Course;
  readonly learning: LearningProgressRepository;
  readonly profile: ProfileRepository;
  readonly getModule: (gameId: string) => GameModule | undefined;
  /** Where progress lives: on this device, or only until the tab closes (storage blocked). */
  readonly persistence: Persistence;
}

export interface ServiceInputs {
  readonly modules: readonly GameModule[];
  readonly clock: Clock;
  readonly seeds: SeedSource;
  readonly progress: ProgressRepository;
  readonly course: Course;
  readonly learning: LearningProgressRepository;
  readonly profile: ProfileRepository;
  readonly persistence?: Persistence;
}

/** Wires the domain to concrete adapters. Production and tests differ only in the inputs. */
export function createServices({
  modules,
  clock,
  seeds,
  progress,
  course,
  learning,
  profile,
  persistence = 'device',
}: ServiceInputs): AppServices {
  const registry = createGameRegistry(modules.map((m) => m.definition));
  const byId = new Map(modules.map((m) => [m.definition.id as string, m]));
  return {
    engine: createGameEngine({ registry, clock, seeds }),
    clock,
    modules,
    progress,
    course,
    learning,
    profile,
    getModule: (gameId) => byId.get(gameId),
    persistence,
  };
}
