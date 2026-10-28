import { validateLevelTable } from '@/domain/difficulty';
import { generateChallenge } from '@/domain/game';
import { executeOrThrow } from '@/domain/pseudocode';
import { deriveSeed, toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { chanceRate, choiceItems, extremeShare, medianRate } from '@/test/guessability';
import { variableTrackingGame } from './content/definition';
import { TRACKING_LEVELS } from './content/levels';
import type { TrackingChallenge } from './content/types';
import { variableTrackingModule } from './index';

describeGameContract(variableTrackingModule);

const SEEDS = Array.from({ length: 60 }, (_, i) => deriveSeed(toSeed(4242), i));
const all = DIFFICULTY_LEVELS.flatMap((level) =>
  SEEDS.map((seed) => ({ level, c: generateChallenge(variableTrackingGame, { level, seed }) })),
);

/** The solution as a string, whatever the format. */
function solution(c: TrackingChallenge): string {
  const { response } = c;
  if (response.format === 'numeric') return String(response.solution.value);
  if (response.format === 'single-choice')
    return response.question.options.find((o) => o.id === response.solution.optionId)?.label ?? '';
  throw new Error(`unexpected format ${response.format}`);
}

describe('Variable Tracking — oracle', () => {
  it('every answer matches an independent run of the interpreter', () => {
    for (const { c } of all) {
      const { kind, source, ask, line, variables } = c.content;
      const lines = source.split('\n');
      if (kind === 'final-value') {
        expect(solution(c)).toBe(String(executeOrThrow(source).variables[ask as string]));
      } else if (kind === 'after-line') {
        // Run only the first `line` lines: straight-line code, so this is the state at that point.
        const prefix = executeOrThrow(lines.slice(0, line as number).join('\n'));
        expect(solution(c)).toBe(String(prefix.variables[ask as string]));
      } else {
        const end = executeOrThrow(source).variables;
        const values = variables.map((v) => end[v] as number);
        const top = Math.max(...values);
        expect(values.filter((v) => v === top)).toHaveLength(1);
        expect(solution(c)).toBe(variables[values.indexOf(top)]);
      }
    }
  });

  it('every line of every program changes a variable (no dead lines)', () => {
    for (const { c } of all) {
      const lines = c.content.source.split('\n');
      for (let n = 1; n < lines.length; n++) {
        const before = executeOrThrow(lines.slice(0, n).join('\n')).variables;
        const after = executeOrThrow(lines.slice(0, n + 1).join('\n')).variables;
        expect(JSON.stringify(after), `${c.id} line ${n + 1}`).not.toBe(JSON.stringify(before));
      }
    }
  });

  it('asked values differ from the starting value', () => {
    for (const { c } of all) {
      if (c.content.kind !== 'final-value') continue;
      const ask = c.content.ask as string;
      const init = c.content.source.split('\n').find((l) => l.startsWith(`${ask} = `));
      expect(solution(c)).not.toBe(init?.split(' = ')[1]);
    }
  });
});

describe('Variable Tracking — levels and measurement', () => {
  it('has a coherent, non-decreasing level table', () => {
    expect(validateLevelTable(TRACKING_LEVELS)).toEqual([]);
    expectNonDecreasing(TRACKING_LEVELS, (p) => p.variableCount, 'variables');
    expectNonDecreasing(TRACKING_LEVELS, (p) => p.statementCount, 'statements');
    expectNonDecreasing(TRACKING_LEVELS, (p) => (p.answer === 'numeric' ? 1 : 0), 'answer');
    expectNonDecreasing(TRACKING_LEVELS, (p) => p.timing.targetMs, 'target time');
  });

  it('number options do not give the answer away by rank', () => {
    const items = choiceItems(all.map(({ c }) => c).filter((c) => c.content.kind !== 'largest'));
    expect(items.length).toBeGreaterThan(60);
    const { observed, chance } = extremeShare(items);
    expect(observed).toBeGreaterThan(chance - 0.15);
    expect(medianRate(items)).toBeLessThan(chanceRate(items) + 0.15);
  });

  it('“largest” is not predictable from the start values or the last line', () => {
    const largest = all.map(({ c }) => c).filter((c) => c.content.kind === 'largest');
    expect(largest.length).toBeGreaterThan(40);
    const items = choiceItems(largest);
    const chance = chanceRate(items);
    const hits = (guess: (c: TrackingChallenge) => string) =>
      largest.filter((c) => guess(c) === solution(c)).length / largest.length;
    const initialMax = (c: TrackingChallenge) => {
      const lines = c.content.source.split('\n').slice(0, c.content.variables.length);
      const values = lines.map((l) => Number(l.split(' = ')[1]));
      return c.content.variables[values.indexOf(Math.max(...values))] as string;
    };
    const lastWritten = (c: TrackingChallenge) =>
      c.content.source
        .split('\n')
        .reverse()
        .find((l) => !l.startsWith('temp'))
        ?.split(' = ')[0] ?? '';
    expect(hits(initialMax)).toBeLessThan(chance + 0.15);
    expect(hits(lastWritten)).toBeLessThan(chance + 0.2);
  });

  it('generates quickly (< 5 ms per challenge on average)', () => {
    // Best of three rounds: the suite runs many files in parallel, which inflates single rounds.
    const round = () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++)
        generateChallenge(variableTrackingGame, { level: 10, seed: toSeed(i) });
      return (performance.now() - start) / 100;
    };
    expect(Math.min(round(), round(), round())).toBeLessThan(5);
  });
});
