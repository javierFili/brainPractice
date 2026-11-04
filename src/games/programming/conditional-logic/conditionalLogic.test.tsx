import { validateLevelTable } from '@/domain/difficulty';
import { generateChallenge } from '@/domain/game';
import { executeOrThrow, type Variables } from '@/domain/pseudocode';
import { deriveSeed, toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { chanceRate, choiceItems } from '@/test/guessability';
import { en } from '@/test/i18n';
import { conditionalLogicGame } from './content/definition';
import { ERROR_OUTCOME } from './content/generate';
import { CONDITIONAL_LEVELS } from './content/levels';
import type { ConditionalChallenge } from './content/types';
import { conditionalLogicModule } from './index';

describeGameContract(conditionalLogicModule);

const SEEDS = Array.from({ length: 60 }, (_, i) => deriveSeed(toSeed(777), i));
const all = DIFFICULTY_LEVELS.flatMap((level) =>
  SEEDS.map((seed) => generateChallenge(conditionalLogicGame, { level, seed })),
);
const ofKind = (kind: ConditionalChallenge['content']['kind']) =>
  all.filter((c) => c.content.kind === kind);

function options(c: ConditionalChallenge) {
  if (c.response.format !== 'single-choice') throw new Error('single-choice expected');
  const { options: list } = c.response.question;
  const answer = list.find((o) => o.id === (c.response.solution as { optionId: string }).optionId);
  return { labels: list.map((o) => en(o.label)), answer: answer ? en(answer.label) : '' };
}

/** Independent run: what the program prints, or the error outcome. */
function outcome(source: string, inputs: Variables = {}): string {
  const result = executeOrThrow(source, inputs);
  if (result.error)
    return result.error.kind === 'value' ? ERROR_OUTCOME : `bug: ${en(result.error.message)}`;
  return result.output.join(' ');
}

/** "x = 4, y = 9, ready = true" → inputs. */
const parseInputs = (label: string): Variables =>
  Object.fromEntries(
    label.split(', ').map((pair) => {
      const [name, value] = pair.split(' = ') as [string, string];
      return [name, value === 'true' ? true : value === 'false' ? false : Number(value)];
    }),
  );

describe('Conditional Logic — oracle', () => {
  it('forward questions: the answer is what the interpreter prints', () => {
    for (const c of all) {
      if (c.content.kind === 'find-input') continue;
      expect(options(c).answer, c.content.source).toBe(outcome(c.content.source));
    }
  });

  it('find-input: exactly one option produces the target output', () => {
    const items = ofKind('find-input');
    expect(items.length).toBeGreaterThan(30);
    for (const c of items) {
      const { labels, answer } = options(c);
      const hits = labels.filter(
        (l) => outcome(c.content.source, parseInputs(l)) === c.content.target,
      );
      expect(hits).toEqual([answer]);
    }
  });

  it(
    'every branch is reachable by some input (no shadowed or equivalent branches)',
    { timeout: 60_000 },
    () => {
      // Every third challenge across all levels (the grid search runs 338 programs per challenge).
      for (const c of all.filter((_, i) => i % 3 === 0)) {
        const body = c.content.source
          .split('\n')
          .filter((l) => !/^(x|y|ready) = /.test(l))
          .join('\n');
        const printed = new Set<string>();
        for (let x = 0; x <= 9; x++)
          for (let y = 0; y <= 9; y++)
            for (const ready of [true, false]) printed.add(outcome(body, { x, y, ready }));
        const labels = [...body.matchAll(/print\("(\w)"\)/g)].map((m) => m[1]);
        for (const label of labels) expect(printed.has(label as string), body).toBe(true);
      }
    },
  );

  it('short-circuit: some answers are errors and some are saved by the guard', () => {
    const answers = ofKind('short-circuit').map((c) => options(c).answer);
    expect(answers.length).toBeGreaterThan(40);
    const errors = answers.filter((a) => a === ERROR_OUTCOME).length;
    expect(errors).toBeGreaterThan(answers.length * 0.1);
    expect(errors).toBeLessThan(answers.length * 0.6);
  });
});

describe('Conditional Logic — levels and measurement', () => {
  it('has a coherent, non-decreasing level table', () => {
    expect(validateLevelTable(CONDITIONAL_LEVELS)).toEqual([]);
    expectNonDecreasing(CONDITIONAL_LEVELS, (p) => p.outcomes, 'outcomes');
    expectNonDecreasing(CONDITIONAL_LEVELS, (p) => p.numberInputs, 'inputs');
    expectNonDecreasing(CONDITIONAL_LEVELS, (p) => p.parts.length, 'condition parts');
    expectNonDecreasing(CONDITIONAL_LEVELS, (p) => p.timing.targetMs, 'target time');
  });

  it('the printed letter is not predictable from its place in the program', () => {
    const forward = [...ofKind('branch'), ...ofKind('nested')];
    const items = choiceItems(forward);
    const chance = chanceRate(items);
    const rate = (guess: (labels: string[]) => string) =>
      items.filter((item) => guess([...item.options].sort()) === item.answer).length / items.length;
    // Always the first branch, always the else branch.
    expect(rate((l) => l[0] as string)).toBeLessThan(chance + 0.12);
    expect(rate((l) => l.at(-1) as string)).toBeLessThan(chance + 0.12);
  });

  it('generates quickly (< 5 ms per challenge on average)', () => {
    // Best of three rounds: the suite runs many files in parallel, which inflates single rounds.
    const round = () => {
      const start = performance.now();
      for (let i = 0; i < 60; i++)
        generateChallenge(conditionalLogicGame, { level: 10, seed: toSeed(i) });
      return (performance.now() - start) / 60;
    };
    expect(Math.min(round(), round(), round())).toBeLessThan(5);
  });
});
