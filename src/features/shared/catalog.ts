import type { GameCategory } from '@/domain/game';
import type { CatalogEntry } from '@/domain/insights';
import type { PathDefinition } from '@/domain/paths';
import type { GameModule } from '@/games/types';
import { GENERAL_CATEGORIES } from './categories';

export const catalogEntries = (modules: readonly GameModule[]): CatalogEntry[] =>
  modules.map(({ definition }) => ({
    id: definition.id,
    name: definition.name,
    category: definition.meta.category,
    audiences: definition.meta.audiences,
    estimatedMinutes: definition.meta.estimatedMinutes,
    relaxedFriendly: definition.meta.relaxedFriendly,
  }));

/** Categories a person is offered by default: programming only on the programmers route. */
export const categoriesFor = (path: PathDefinition | undefined): GameCategory[] =>
  path?.id === 'programmers' ? [...GENERAL_CATEGORIES, 'programming'] : [...GENERAL_CATEGORIES];

/**
 * Games the daily challenge rotates through: the route's games when one is chosen, otherwise every
 * general game. Only registered games are included, so the rotation never points at nothing.
 */
export function dailyPool(
  modules: readonly GameModule[],
  path: PathDefinition | undefined,
): string[] {
  const ids = new Set(modules.map((m) => m.definition.id as string));
  if (path) {
    const featured = path.featured.filter((id) => ids.has(id));
    if (featured.length > 0) return featured;
  }
  return modules
    .filter((m) => m.definition.meta.category !== 'programming')
    .map((m) => m.definition.id as string);
}
