import { createGameRegistry } from '@/domain/game';
import type { ProgressRepository } from '@/domain/progress';
import type { SeedSource } from '@/domain/random';
import type { Clock } from '@/domain/time/Clock';
import { createGameEngine, type GameEngine } from '@/engine';
import type { GameModule } from '@/games/types';

export interface AppServices {
  readonly engine: GameEngine;
  readonly clock: Clock;
  readonly modules: readonly GameModule[];
  readonly progress: ProgressRepository;
  readonly getModule: (gameId: string) => GameModule | undefined;
}

export interface ServiceInputs {
  readonly modules: readonly GameModule[];
  readonly clock: Clock;
  readonly seeds: SeedSource;
  readonly progress: ProgressRepository;
}

/** Wires the domain to concrete adapters. Production and tests differ only in the inputs. */
export function createServices({ modules, clock, seeds, progress }: ServiceInputs): AppServices {
  const registry = createGameRegistry(modules.map((m) => m.definition));
  const byId = new Map(modules.map((m) => [m.definition.id as string, m]));
  return {
    engine: createGameEngine({ registry, clock, seeds }),
    clock,
    modules,
    progress,
    getModule: (gameId) => byId.get(gameId),
  };
}
