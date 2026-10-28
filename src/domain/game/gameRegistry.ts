import type { CognitiveArea } from '../shared/cognitiveArea';
import { DomainError } from '../shared/errors';
import { validateLevelTable } from '../difficulty/difficultyProfile';
import type { GameDefinition } from './gameDefinition';
import { validateGameMeta, type GameCategory } from './catalog';

export class InvalidGameDefinitionError extends DomainError {
  constructor(gameId: string, issues: readonly string[]) {
    super('INVALID_GAME_DEFINITION', `Game "${gameId}" is invalid: ${issues.join('; ')}`);
  }
}

export interface GameRegistry {
  get(id: string): GameDefinition | undefined;
  list(): readonly GameDefinition[];
  byArea(area: CognitiveArea): readonly GameDefinition[];
  byCategory(category: GameCategory): readonly GameDefinition[];
}

/** Validates every definition up front so a broken game fails at startup, not mid-session. */
export function createGameRegistry(definitions: readonly GameDefinition[]): GameRegistry {
  const byId = new Map<string, GameDefinition>();
  for (const game of definitions) {
    const issues = validateLevelTable(game.levels);
    if (byId.has(game.id)) issues.push('duplicate game id');
    if (game.instructions.length === 0) issues.push('instructions are empty');
    if (game.skills.length === 0) issues.push('skills are empty');
    issues.push(...validateGameMeta(game.meta));
    if (issues.length > 0) throw new InvalidGameDefinitionError(game.id, issues);
    byId.set(game.id, game);
  }
  const all = [...byId.values()];
  return {
    get: (id) => byId.get(id),
    list: () => all,
    byArea: (area) => all.filter((game) => game.area === area),
    byCategory: (category) => all.filter((game) => game.meta.category === category),
  };
}
