import type { Challenge } from '@/domain/challenge';
import { generateChallenge, type GameDefinition } from '@/domain/game';
import { contractSeeds } from '@/test/gameContract';
import { centroidRate, chanceRate, choiceItems } from '@/test/guessability';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/domain/shared';
import { parseFigure, parseGrid } from './content';

/** Test-only helpers shared by the Patterns games. */

export function generateMany<C extends Challenge>(
  definition: GameDefinition<C>,
  seedsPerLevel = 40,
  levels: readonly DifficultyLevel[] = DIFFICULTY_LEVELS,
): { level: DifficultyLevel; challenge: C }[] {
  const seeds = contractSeeds(seedsPerLevel, 31);
  return levels.flatMap((level) =>
    seeds.map((seed) => ({ level, challenge: generateChallenge(definition, { level, seed }) })),
  );
}

export function solutionLabel(challenge: Challenge): string {
  const { response } = challenge;
  if (response.format !== 'single-choice') throw new Error('single-choice expected');
  const option = response.question.options.find((o) => o.id === response.solution.optionId);
  if (!option) throw new Error('solution not among options');
  return option.label;
}

export function optionLabels(challenge: Challenge): string[] {
  const { response } = challenge;
  if (response.format !== 'single-choice') throw new Error('single-choice expected');
  return response.question.options.map((o) => o.label);
}

/** Number of differing features between two figure labels. */
export function figureDistance(a: string, b: string): number {
  const fa = parseFigure(a);
  const fb = parseFigure(b);
  if (!fa || !fb) throw new Error(`Not figure labels: ${a} | ${b}`);
  return (
    Number(fa.shape !== fb.shape) +
    Number(fa.color !== fb.color) +
    Number(fa.count !== fb.count) +
    Number(fa.rotation !== fb.rotation)
  );
}

/** Number of differing cells between two tile-grid labels of the same size (else a large value). */
export function gridDistance(a: string, b: string): number {
  const ga = parseGrid(a);
  const gb = parseGrid(b);
  if (!ga || !gb) throw new Error(`Not grid labels: ${a} | ${b}`);
  if (ga.length !== gb.length || ga[0]?.length !== gb[0]?.length) return 100;
  return ga.reduce(
    (sum, row, r) => sum + row.filter((v, c) => v !== (gb[r] as number[])[c]).length,
    0,
  );
}

/** "Pick the option most similar to the others" must not beat chance by more than `margin`. */
export function expectNoCentroidBias(
  challenges: readonly Challenge[],
  distance: (a: string, b: string) => number,
  margin = 0.08,
) {
  const items = choiceItems(challenges);
  expect(items.length).toBeGreaterThan(50);
  expect(centroidRate(items, distance)).toBeLessThan(chanceRate(items) + margin);
}

/** Average generation time across all levels stays under the 5 ms budget. */
export function expectFastGeneration<C extends Challenge>(definition: GameDefinition<C>) {
  const runs = contractSeeds(20, 99);
  const start = performance.now();
  for (const level of DIFFICULTY_LEVELS)
    for (const seed of runs) generateChallenge(definition, { level, seed });
  const average = (performance.now() - start) / (runs.length * DIFFICULTY_LEVELS.length);
  expect(average).toBeLessThan(5);
}
