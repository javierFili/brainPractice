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
  /** Loads the curriculum on first use (it is a separate chunk); always the same promise. */
  readonly loadCourse: () => Promise<Course>;
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
  readonly loadCourse: () => Promise<Course>;
  readonly learning: LearningProgressRepository;
  readonly profile: ProfileRepository;
  readonly persistence?: Persistence;
}

type Tracked<T> = Promise<T> & {
  status?: 'pending' | 'fulfilled' | 'rejected';
  value?: T;
  reason?: unknown;
};

/**
 * Records the outcome on the promise itself, the protocol React's `use()` reads: once loaded, the
 * course is returned synchronously and components never suspend on it again.
 */
export function tracked<T>(promise: Promise<T>): Promise<T> {
  const thenable = promise as Tracked<T>;
  if (thenable.status !== undefined) return thenable;
  thenable.status = 'pending';
  thenable.then(
    (value) => {
      thenable.status = 'fulfilled';
      thenable.value = value;
    },
    (reason: unknown) => {
      thenable.status = 'rejected';
      thenable.reason = reason;
    },
  );
  return thenable;
}

/** Wires the domain to concrete adapters. Production and tests differ only in the inputs. */
export function createServices({
  modules,
  clock,
  seeds,
  progress,
  loadCourse,
  learning,
  profile,
  persistence = 'device',
}: ServiceInputs): AppServices {
  let course: Promise<Course> | null = null;
  const registry = createGameRegistry(modules.map((m) => m.definition));
  const byId = new Map(modules.map((m) => [m.definition.id as string, m]));
  return {
    engine: createGameEngine({ registry, clock, seeds }),
    clock,
    modules,
    progress,
    loadCourse: () => (course ??= tracked(loadCourse())),
    learning,
    profile,
    getModule: (gameId) => byId.get(gameId),
    persistence,
  };
}
