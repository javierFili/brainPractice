import type { Audience, GameCategory } from '../game/catalog';
import type { Text } from '../shared/text';

/**
 * A route is configuration over the shared catalog: copy, a curated order of games and suggested
 * settings. It never hides games or caps levels — anyone can play anything.
 */
export interface PathDefinition {
  readonly id: Audience;
  readonly name: Text;
  readonly tagline: Text;
  readonly intro: Text;
  readonly goals: readonly Text[];
  /** Curated games, best first. Must all exist in the catalog (checked by tests). */
  readonly featured: readonly string[];
  /** Categories this route leans on, for variety suggestions. */
  readonly focus: readonly GameCategory[];
  /** How sessions are offered on the route page. */
  readonly suggestedMinutes: number;
  /** Notes shown on the route page (privacy for kids, pacing for seniors…). */
  readonly notes: readonly Text[];
}

export function validatePaths(
  paths: readonly PathDefinition[],
  gameExists: (id: string) => boolean,
): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const path of paths) {
    if (ids.has(path.id)) issues.push(`duplicate path ${path.id}`);
    ids.add(path.id);
    if (path.featured.length < 6) issues.push(`${path.id}: needs at least 6 featured games`);
    if (new Set(path.featured).size !== path.featured.length)
      issues.push(`${path.id}: duplicate featured games`);
    for (const id of path.featured)
      if (!gameExists(id)) issues.push(`${path.id}: unknown game ${id}`);
    if (path.goals.length === 0) issues.push(`${path.id}: goals are empty`);
  }
  return issues;
}
