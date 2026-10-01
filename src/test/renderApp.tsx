import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { ProgressRepository, UserProgress } from '@/domain/progress';
import type { Clock } from '@/domain/time/Clock';
import { createServices } from '@/app/composition';
import type { Persistence } from '@/infrastructure/browserStorage';
import { ServicesProvider } from '@/app/providers/ServicesProvider';
import { routes } from '@/app/routes';
import { GAME_MODULES } from '@/games/registry';
import { FakeClock } from './fakes/FakeClock';
import { FixedSeedSource } from './fakes/FixedSeedSource';
import { InMemoryProgressRepository } from './fakes/InMemoryProgressRepository';

interface Options {
  readonly clock?: Clock;
  readonly seed?: number;
  readonly progress?: UserProgress | null;
  /** Replaces the in-memory repository (e.g. to simulate storage failures). */
  readonly repository?: ProgressRepository;
  readonly persistence?: Persistence;
}

export function createTestServices({
  clock = new FakeClock(),
  seed = 1,
  progress = null,
  repository,
  persistence = 'device',
}: Options = {}) {
  const memory = new InMemoryProgressRepository(progress);
  const services = createServices({
    modules: GAME_MODULES,
    clock,
    seeds: new FixedSeedSource(seed),
    progress: repository ?? memory,
    persistence,
  });
  return { services, repository: memory };
}

/** Renders any element inside the app providers and a memory router. */
export function renderWithServices(element: ReactElement, options: Options = {}) {
  const { services, repository } = createTestServices(options);
  const router = createMemoryRouter([{ path: '*', element }]);
  const view = render(
    <ServicesProvider services={services}>
      <RouterProvider router={router} />
    </ServicesProvider>,
  );
  return { ...view, repository, services };
}

/** Renders the real app (routes, providers, games) with deterministic adapters. */
export function renderApp(path: string, options: Options = {}) {
  const { services, repository } = createTestServices(options);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(
    <ServicesProvider services={services}>
      <RouterProvider router={router} />
    </ServicesProvider>,
  );
  return { ...view, router, repository, services };
}
