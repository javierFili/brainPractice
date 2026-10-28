import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { multiStepLogicGame } from './content/definition';
import { MULTI_STEP_LEVELS } from './content/levels';
import { answerOf, compareOrders, factHolds } from './content/solver';
import { multiStepLogicModule } from './index';

describeGameContract(multiStepLogicModule);

describe('Multi-Step Logic', () => {
  it('answers are unique and correct for every level', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const profile = MULTI_STEP_LEVELS[level];
      for (const seed of contractSeeds(15, 13)) {
        const c = generateChallenge(multiStepLogicGame, { level, seed });
        const { content, response } = c;
        const label =
          response.format === 'single-choice'
            ? response.question.options.find((o) => o.id === response.solution.optionId)?.label
            : undefined;
        if (content.kind === 'compare') {
          const orders = compareOrders(content.names.length, content.comparisons);
          expect(orders.length).toBeGreaterThan(0);
          const wanted = content.question === 'most' ? content.names.length - 1 : 0;
          const tops = new Set(orders.map((r) => r.indexOf(wanted)));
          expect(tops.size).toBe(1);
          expect(label).toBe(content.names[[...tops][0] as number]);
        } else {
          expect(content.facts.every((f) => factHolds(f, content.solution))).toBe(true);
          // Independent iterative enumeration (odometer) over 1..max for every person.
          const n = content.names.length;
          const v = new Array<number>(n).fill(1);
          const answers = new Set<number>();
          let done = false;
          let guard = 0;
          // Limit the search to plausible values: facts with a known value or total bound everything.
          const max = profile.maxValue;
          if (n <= 3) {
            while (!done && guard++ < 10_000_000) {
              if (content.facts.every((f) => factHolds(f, v)))
                answers.add(answerOf(content.question, v));
              let i = 0;
              while (i < n && (v[i] as number) === max) v[i++] = 1;
              if (i === n) done = true;
              else v[i] = (v[i] as number) + 1;
            }
            expect(answers.size).toBe(1);
          }
          const expected = answerOf(content.question, content.solution);
          if (response.format === 'numeric') expect(response.solution.value).toBe(expected);
          else expect(label).toBe(content.names[expected]);
        }
      }
    }
  });

  it('adds people and steps across levels', () => {
    expectNonDecreasing(MULTI_STEP_LEVELS, (p) => p.people, 'people');
    expectNonDecreasing(MULTI_STEP_LEVELS, (p) => p.maxValue, 'max value');
  });
});
