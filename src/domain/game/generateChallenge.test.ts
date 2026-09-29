import { fixtureGame, type FixtureChallenge } from '@/test/fixtures/fixtureGame';
import { InvalidSeedError } from '../random/seed';
import { DIFFICULTY_LEVELS } from '../shared/difficultyLevel';
import type { GameDefinition } from './gameDefinition';
import { ChallengeGenerationError, generateChallenge } from './generateChallenge';

const withGenerator = (
  generate: GameDefinition<FixtureChallenge, (typeof fixtureGame)['levels'][1]>['generate'],
) => ({ ...fixtureGame, generate });

describe('generateChallenge', () => {
  it('is reproducible: same game, level and seed yield the same challenge', () => {
    expect(generateChallenge(fixtureGame, { level: 7, seed: 12345 })).toEqual(
      generateChallenge(fixtureGame, { level: 7, seed: 12345 }),
    );
  });

  it('varies with the seed', () => {
    const a = generateChallenge(fixtureGame, { level: 7, seed: 1 });
    const b = generateChallenge(fixtureGame, { level: 7, seed: 2 });
    expect(a.content).not.toEqual(b.content);
  });

  it('stamps the identity and uses the level profile', () => {
    const challenge = generateChallenge(fixtureGame, { level: 4, seed: 99 });
    expect(challenge).toMatchObject({
      id: 'fixture-max:4:99',
      gameId: 'fixture-max',
      area: 'logic',
      level: 4,
      seed: 99,
    });
    expect(challenge.content.values).toHaveLength(5);
  });

  it('produces valid challenges at every level across many seeds', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (let seed = 0; seed < 50; seed++) {
        expect(() => generateChallenge(fixtureGame, { level, seed })).not.toThrow();
      }
    }
  });

  it.each([-1, 1.5, Number.NaN, 2 ** 32])('rejects invalid seed %s', (seed) => {
    expect(() => generateChallenge(fixtureGame, { level: 1, seed })).toThrow(InvalidSeedError);
  });

  it('rejects a generator that produces an invalid challenge', () => {
    const broken = withGenerator((params) => ({
      ...fixtureGame.generate(params),
      explanation: '',
      response: { format: 'locate', question: { itemCount: 2 }, solution: { index: 5 } },
    }));
    expect(() => generateChallenge(broken, { level: 1, seed: 1 })).toThrow(
      ChallengeGenerationError,
    );
  });

  it('rejects a generator that tampers with the identity', () => {
    const tampered = withGenerator((params) => ({ ...fixtureGame.generate(params), level: 2 }));
    expect(() => generateChallenge(tampered, { level: 1, seed: 1 })).toThrow(
      /level does not match/,
    );
  });
});
