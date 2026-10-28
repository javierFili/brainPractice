import { validateLevelTable } from '@/domain/difficulty';
import { generateChallenge } from '@/domain/game';
import { executeOrThrow } from '@/domain/pseudocode';
import { deriveSeed, toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { chanceRate, choiceItems, extremeShare, medianRate } from '@/test/guessability';
import { loopPredictionGame } from './content/definition';
import { LOOP_LEVELS } from './content/levels';
import type { LoopChallenge } from './content/types';
import { loopPredictionModule } from './index';

describeGameContract(loopPredictionModule);

const SEEDS = Array.from({ length: 60 }, (_, i) => deriveSeed(toSeed(99), i));
const all = DIFFICULTY_LEVELS.flatMap((level) =>
  SEEDS.map((seed) => generateChallenge(loopPredictionGame, { level, seed })),
);

function solution(c: LoopChallenge): number {
  const { response } = c;
  if (response.format === 'numeric') return response.solution.value;
  if (response.format === 'single-choice')
    return Number(
      response.question.options.find((o) => o.id === response.solution.optionId)?.label,
    );
  throw new Error('unexpected format');
}

describe('Loop Prediction — oracle', () => {
  it('every answer matches an independent interpreter run', () => {
    for (const c of all) {
      const run = executeOrThrow(c.content.source);
      expect(run.error).toBeNull();
      const { kind, line, ask } = c.content;
      if (kind === 'iterations') {
        // Instrument independently: count how often the line runs via the full trace.
        expect(run.trace.length).toBeLessThan(400);
        expect(solution(c)).toBe(run.trace.filter((s) => s.line === line).length);
      } else if (kind === 'final-value') {
        expect(solution(c)).toBe(run.variables[ask as string]);
      } else {
        expect(String(solution(c))).toBe(run.output.at(-1));
      }
    }
  });

  it('uses every structure the level allows', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const seen = new Set(all.filter((c) => c.level === level).map((c) => c.content.structure));
      for (const structure of Object.keys(LOOP_LEVELS[level].structures))
        expect(seen.has(structure as LoopChallenge['content']['structure']), `level ${level}`).toBe(
          true,
        );
    }
  });

  it('early exits really exit early in a good share of programs', () => {
    const early = all.filter((c) => c.content.structure === 'early-exit');
    expect(early.length).toBeGreaterThan(40);
    const cut = early.filter((c) => {
      const run = executeOrThrow(c.content.source);
      const { result, items, i } = run.variables;
      return result !== undefined ? result !== -1 : Array.isArray(items) && i !== items.length;
    });
    expect(cut.length / early.length).toBeGreaterThan(0.3);
  });
});

describe('Loop Prediction — levels and measurement', () => {
  it('has a coherent, non-decreasing level table', () => {
    expect(validateLevelTable(LOOP_LEVELS)).toEqual([]);
    expectNonDecreasing(LOOP_LEVELS, (p) => Object.keys(p.kinds).length, 'question kinds');
    expectNonDecreasing(LOOP_LEVELS, (p) => (p.answer === 'numeric' ? 1 : 0), 'answer');
    expectNonDecreasing(LOOP_LEVELS, (p) => p.timing.targetMs, 'target time');
    const hardest = (p: (typeof LOOP_LEVELS)[1]) =>
      Math.max(
        ...Object.keys(p.structures).map((s) =>
          ['simple', 'conditional', 'nested', 'early-exit'].indexOf(s),
        ),
      );
    expectNonDecreasing(LOOP_LEVELS, hardest, 'hardest structure');
  });

  it('number options do not give the answer away by rank', () => {
    const items = choiceItems(all);
    expect(items.length).toBeGreaterThan(60);
    const { observed, chance } = extremeShare(items);
    expect(observed).toBeGreaterThan(chance - 0.15);
    expect(medianRate(items)).toBeLessThan(chanceRate(items) + 0.15);
  });

  it('generates quickly (< 5 ms per challenge on average)', () => {
    // Best of three rounds: the suite runs many files in parallel, which inflates single rounds.
    const round = () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++)
        generateChallenge(loopPredictionGame, { level: 10, seed: toSeed(i) });
      return (performance.now() - start) / 100;
    };
    expect(Math.min(round(), round(), round())).toBeLessThan(5);
  });
});
