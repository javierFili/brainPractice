import { fixtureGame } from '@/test/fixtures/fixtureGame';
import { gameIdOf } from '../shared/ids';
import { createGameRegistry, InvalidGameDefinitionError } from './gameRegistry';

const other = { ...fixtureGame, id: gameIdOf('fixture-other'), area: 'memory' as const };

describe('createGameRegistry', () => {
  const registry = createGameRegistry([fixtureGame, other]);

  it('finds games by id and returns undefined for unknown ids', () => {
    expect(registry.get('fixture-max')).toBe(fixtureGame);
    expect(registry.get('missing')).toBeUndefined();
  });

  it('lists games in registration order and filters by area', () => {
    expect(registry.list()).toEqual([fixtureGame, other]);
    expect(registry.byArea('memory')).toEqual([other]);
    expect(registry.byArea('speed')).toEqual([]);
  });

  it('rejects duplicate ids', () => {
    expect(() => createGameRegistry([fixtureGame, fixtureGame])).toThrow(/duplicate game id/);
  });

  it('rejects games with an invalid level table or missing texts', () => {
    const broken = {
      ...fixtureGame,
      instructions: [],
      skills: [],
      levels: { ...fixtureGame.levels, 5: { ...fixtureGame.levels[5], challengeCount: 0 } },
    };
    expect(() => createGameRegistry([broken])).toThrow(InvalidGameDefinitionError);
    expect(() => createGameRegistry([broken])).toThrow(
      /level 5: challengeCount.*instructions are empty.*skills are empty/,
    );
  });
});
