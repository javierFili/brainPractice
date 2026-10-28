import { PATHS } from '@/content/paths';
import { createGameRegistry, GAME_CATEGORIES } from '@/domain/game';
import { planAssessment } from '@/domain/assessment';
import { validatePaths } from '@/domain/paths';
import { COLLECTIONS } from '@/features/catalog/collections';
import { ASSESSMENT_PROTOCOLS } from './assessment';
import { GAME_MODULES } from './registry';

const registry = createGameRegistry(GAME_MODULES.map((m) => m.definition));
const exists = (id: string) => registry.get(id) !== undefined;

describe('catalog integrity', () => {
  it('has at least ten games in every category', () => {
    for (const category of GAME_CATEGORIES) {
      expect(registry.byCategory(category).length, category).toBeGreaterThanOrEqual(10);
    }
  });

  it('gives every route only existing games', () => {
    expect(validatePaths(PATHS, exists)).toEqual([]);
  });

  it('builds every assessment protocol from existing games', () => {
    for (const { definition } of ASSESSMENT_PROTOCOLS) {
      expect(planAssessment(definition).every((step) => exists(step.gameId))).toBe(true);
    }
  });

  it('fills every cross-category collection', () => {
    const all = GAME_MODULES.map((m) => m.definition);
    for (const collection of COLLECTIONS) {
      expect(all.filter(collection.includes).length, collection.id).toBeGreaterThanOrEqual(4);
    }
  });

  it('labels every game with plain, non-diagnostic copy', () => {
    const banned = /\b(IQ|diagnos|cure|prevent|dementia|deficit|brain age)\b/i;
    for (const { definition } of GAME_MODULES) {
      const text = [
        definition.description,
        definition.tagline,
        ...definition.instructions,
        definition.meta.scoringSummary,
      ].join(' ');
      expect(banned.test(text), definition.id).toBe(false);
    }
  });
});
