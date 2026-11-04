import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { en } from '@/test/i18n';
import { valueLabel } from './content/categories';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { logicalDeductionGame } from './content/definition';
import { LOGICAL_DEDUCTION_LEVELS } from './content/levels';
import { clueHolds, solveTables } from './content/solver';
import { logicalDeductionModule } from './index';

describeGameContract(logicalDeductionModule);

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

describe('Logical Deduction', () => {
  it('has exactly one table that fits every clue, and it answers the question', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (const seed of contractSeeds(15, 99)) {
        const c = generateChallenge(logicalDeductionGame, { level, seed });
        const { content, response } = c;
        // Independent check of every clue against the stored solution…
        expect(content.clues.every((clue) => clueHolds(clue, content.solution))).toBe(true);
        // …and brute-force uniqueness over every possible table.
        const tables = solveTables(content.people.length, content.categories.length, content.clues);
        expect(tables).toHaveLength(1);
        expect(tables[0]).toEqual(content.solution);
        if (response.format !== 'single-choice') throw new Error('single-choice expected');
        const answer = response.question.options.find((o) => o.id === response.solution.optionId);
        const q = content.question;
        const category = content.categories[q.category];
        const expected =
          q.type === 'who'
            ? content.people[(content.solution[q.category] ?? []).indexOf(q.value)]
            : category &&
              en(
                valueLabel(
                  category.id,
                  category.values[content.solution[q.category]?.[q.person] as number] as string,
                ),
              );
        expect(answer && en(answer.label)).toBe(expected);
      }
    }
  });

  it('grows the puzzle across levels', () => {
    expectNonDecreasing(
      LOGICAL_DEDUCTION_LEVELS,
      (p) => factorial(p.people) ** p.categories,
      'search space',
    );
    expect(LOGICAL_DEDUCTION_LEVELS[10].clueTypes.is).toBeUndefined();
  });
});
