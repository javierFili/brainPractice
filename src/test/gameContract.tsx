import { render } from '@testing-library/react';
import { evaluateAnswer, solutionAnswer, type Challenge } from '@/domain/challenge';
import type { DifficultyProfile, LevelTable } from '@/domain/difficulty';
import { createGameRegistry, generateChallenge } from '@/domain/game';
import { deriveSeed, toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/domain/shared';
import type { ChallengePhase, GameModule } from '@/games/types';

/** Seeds derived like a real session's, so generators see realistic seed streams. */
export const contractSeeds = (count: number, base = 2024) =>
  Array.from({ length: count }, (_, i) => deriveSeed(toSeed(base), i));

export function generateAll(
  module: GameModule,
  seedsPerLevel: number,
): { level: DifficultyLevel; challenge: Challenge }[] {
  const seeds = contractSeeds(seedsPerLevel);
  return DIFFICULTY_LEVELS.flatMap((level) =>
    seeds.map((seed) => ({
      level,
      challenge: generateChallenge(module.definition, { level, seed }),
    })),
  );
}

/**
 * The behaviour every game must have to count as "functional" (docs/game-catalog.md): it
 * registers, generates valid and reproducible challenges at all ten levels, every challenge is
 * solvable by its own solution, labels cover every kind, single-choice answers are not biased
 * towards a position, and its view renders in every phase.
 */
export function describeGameContract(module: GameModule, { seedsPerLevel = 30 } = {}) {
  const { definition } = module;

  describe(`${definition.id} · game contract`, () => {
    const all = generateAll(module, seedsPerLevel);

    it('passes registry validation (levels 1–10, texts, catalog metadata)', () => {
      expect(() => createGameRegistry([definition])).not.toThrow();
    });

    it('generates the same challenge for the same level and seed', () => {
      for (const level of [1, 5, 10] as const) {
        const seed = toSeed(777 + level);
        expect(generateChallenge(definition, { level, seed })).toEqual(
          generateChallenge(definition, { level, seed }),
        );
      }
    });

    it('accepts its own solution for every generated challenge', () => {
      for (const { challenge } of all) {
        expect(evaluateAnswer(challenge.response, solutionAnswer(challenge.response))).toEqual({
          ok: true,
          value: true,
        });
      }
    });

    it('labels every content kind it generates', () => {
      const kinds = new Set(all.map(({ challenge }) => challenge.content.kind));
      for (const kind of kinds) {
        expect(module.kindLabels[kind]).toBeTruthy();
      }
    });

    it('varies between seeds', () => {
      for (const level of DIFFICULTY_LEVELS) {
        const contents = all
          .filter((entry) => entry.level === level)
          .map(({ challenge }) => JSON.stringify([challenge.content, challenge.response]));
        expect(new Set(contents).size).toBeGreaterThan(Math.min(5, seedsPerLevel / 2));
      }
    });

    it('does not favour an answer position in single-choice challenges', () => {
      const positions: number[] = [];
      let optionTotal = 0;
      for (const { challenge } of all) {
        const { response } = challenge;
        if (response.format !== 'single-choice') continue;
        const { options } = response.question;
        positions.push(options.findIndex((o) => o.id === response.solution.optionId));
        optionTotal += options.length;
      }
      if (positions.length < 60) return;
      const meanOptions = optionTotal / positions.length;
      const firstRate = positions.filter((p) => p === 0).length / positions.length;
      expect(firstRate).toBeLessThan(2.2 / meanOptions);
    });

    it('renders its content view in study, respond and review phases at every level', () => {
      const { ContentView } = module;
      for (const level of DIFFICULTY_LEVELS) {
        const entry = all.find((e) => e.level === level);
        if (!entry) throw new Error(`No challenge at level ${level}`);
        const phases: ChallengePhase[] =
          entry.challenge.timing.studyMs === null
            ? ['respond', 'review']
            : ['study', 'respond', 'review'];
        for (const phase of phases) {
          const view = render(
            <ContentView
              challenge={entry.challenge}
              phase={phase}
              locate={null}
              respond={phase === 'respond' ? () => undefined : null}
              answer={phase === 'review' ? solutionAnswer(entry.challenge.response) : null}
              assisted={false}
            />,
          );
          expect(view.container).not.toBeEmptyDOMElement();
          view.unmount();
        }
      }
    });
  });
}

/** Asserts `key(profile)` never decreases from level 1 to 10. */
export function expectNonDecreasing<P extends DifficultyProfile>(
  levels: LevelTable<P>,
  key: (profile: P) => number,
  label = 'parameter',
) {
  const values = DIFFICULTY_LEVELS.map((level) => key(levels[level]));
  for (let i = 1; i < values.length; i++) {
    expect(
      values[i],
      `${label} drops at level ${i + 1}: ${values.join(', ')}`,
    ).toBeGreaterThanOrEqual(values[i - 1] as number);
  }
}

/** Asserts consecutive levels differ in at least one task parameter (beyond the objective text). */
export function expectDistinctLevels<P extends DifficultyProfile>(levels: LevelTable<P>) {
  const strip = (profile: P) => {
    return JSON.stringify({ ...profile, level: 0, tier: null, objective: null });
  };
  for (const level of DIFFICULTY_LEVELS.slice(1)) {
    expect(strip(levels[level]), `level ${level} repeats level ${level - 1}`).not.toBe(
      strip(levels[(level - 1) as DifficultyLevel]),
    );
  }
}
