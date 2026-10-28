import { validateLevelTable } from '@/domain/difficulty';
import { generateChallenge } from '@/domain/game';
import { execute } from '@/domain/pseudocode';
import { deriveSeed, toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { algorithmConstructionGame } from './content/definition';
import { CONSTRUCTION_LEVELS } from './content/levels';
import type { ConstructionChallenge } from './content/types';
import { algorithmConstructionModule } from './index';

describeGameContract(algorithmConstructionModule, { seedsPerLevel: 20 });

const SEEDS = Array.from({ length: 25 }, (_, i) => deriveSeed(toSeed(2718), i));
const all = DIFFICULTY_LEVELS.flatMap((level) =>
  SEEDS.map((seed) => generateChallenge(algorithmConstructionGame, { level, seed })),
);

function permutations<T>(items: readonly T[], length = items.length): T[][] {
  if (length === 0) return [[]];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)], length - 1).map((rest) => [
      item,
      ...rest,
    ]),
  );
}

/** Independent oracle: assemble the source text of an order, parse and run it from scratch. */
function prints(c: ConstructionChallenge, ids: readonly string[]): string | null {
  const source = ids.map((id) => c.content.blocks.find((b) => b.id === id)?.code ?? '').join('\n');
  const result = execute(source);
  if (!result.ok || result.value.error !== null) return null;
  return result.value.output.join('\n');
}

describe('Algorithm Construction — oracle', () => {
  // Brute force over every order, re-parsing the full text each time (independent of the
  // generator's chained search). Seven-block challenges (5040 orders) are sampled.
  it(
    'the solution prints the target and no other order does (brute force on full text)',
    { timeout: 120_000 },
    () => {
      const large = all.filter((c) => c.content.blocks.length > 6).slice(0, 4);
      for (const c of [...all.filter((x) => x.content.blocks.length <= 6), ...large]) {
        if (c.response.format !== 'ordering') throw new Error('ordering expected');
        const ids = c.content.blocks.map((b) => b.id);
        const used = c.content.kind === 'spare-block' ? ids.length - 1 : ids.length;
        const target = c.content.target.join('\n');
        const solution = c.response.solution.order;
        expect(prints(c, solution.slice(0, used))).toBe(target);
        const winners = permutations(ids, used).filter((order) => prints(c, order) === target);
        expect(winners, c.content.blocks.map((b) => b.code).join(' | ')).toEqual([
          solution.slice(0, used),
        ]);
      }
    },
  );

  it('never shows the blocks already in the right order', () => {
    for (const c of all) {
      if (c.response.format !== 'ordering') continue;
      expect(c.response.solution.order).not.toEqual(c.response.question.items.map((i) => i.id));
    }
  });

  it('loop levels really contain loop blocks, spare levels a spare', () => {
    for (const c of all) {
      const loops = c.content.blocks.filter((b) => b.code.includes('\n')).length;
      expect(loops).toBeGreaterThanOrEqual(CONSTRUCTION_LEVELS[c.level].loops);
    }
    expect(all.some((c) => c.content.kind === 'spare-block')).toBe(true);
  });
});

describe('Algorithm Construction — levels', () => {
  it('has a coherent, non-decreasing level table', () => {
    expect(validateLevelTable(CONSTRUCTION_LEVELS)).toEqual([]);
    expectNonDecreasing(CONSTRUCTION_LEVELS, (p) => p.blockCount, 'blocks');
    expectNonDecreasing(CONSTRUCTION_LEVELS, (p) => p.loops, 'loops');
    expectNonDecreasing(CONSTRUCTION_LEVELS, (p) => p.timing.targetMs, 'target time');
  });

  it('the first block shown is not a reliable hint (the answer’s first block is anywhere)', () => {
    let first = 0;
    for (const c of all) {
      if (c.response.format !== 'ordering') continue;
      if (c.response.solution.order[0] === c.response.question.items[0]?.id) first++;
    }
    expect(first / all.length).toBeLessThan(0.4);
  });

  it('generates quickly (< 5 ms per challenge on average)', () => {
    // Best of three rounds: the suite runs many files in parallel, which inflates single rounds.
    const round = () => {
      const start = performance.now();
      for (let i = 0; i < 60; i++)
        generateChallenge(algorithmConstructionGame, { level: 10, seed: toSeed(i) });
      return (performance.now() - start) / 60;
    };
    expect(Math.min(round(), round(), round())).toBeLessThan(5);
  });
});
