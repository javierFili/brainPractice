import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { numberSequencesGame } from './content/definition';
import { NUMBER_SEQUENCES_LEVELS } from './content/levels';
import { fittingRules, uniqueHiddenTerm } from './content/rules';
import { numberSequencesModule } from './index';

describeGameContract(numberSequencesModule);

/** Independent oracle: low-degree polynomial extrapolation via finite differences. */
function polynomialNext(values: readonly number[]): number {
  let rows = [values.slice()];
  while ((rows.at(-1) as number[]).some((v) => v !== 0) && (rows.at(-1) as number[]).length > 1) {
    const last = rows.at(-1) as number[];
    rows = [...rows, last.slice(1).map((v, i) => v - (last[i] as number))];
  }
  return rows.reduce((sum, row) => sum + (row.at(-1) as number), 0);
}

describe('Number Sequences', () => {
  it('library: two rules that disagree make the sequence ambiguous', () => {
    // 1, 2, 4, 8 fits both "multiply by 2" and others; with a hidden 5th term after 4 visible
    // terms and nothing after it, cubic and doubling disagree.
    expect(uniqueHiddenTerm([1, 2, 4, 8, 0], 4)).toBeNull();
    expect(uniqueHiddenTerm([2, 5, 8, 11, 14, 17, 0], 6)).toBe(20);
  });

  it('every challenge has a single hidden term that all fitting rules agree on', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (const seed of contractSeeds(20, 7)) {
        const c = generateChallenge(numberSequencesGame, { level, seed });
        const { terms, hiddenIndex } = c.content;
        if (c.response.format !== 'numeric') throw new Error('numeric expected');
        const value = c.response.solution.value;
        expect(terms[hiddenIndex]).toBeNull();
        expect(terms.filter((t) => t === null)).toHaveLength(1);
        const full = terms.map((t) => t ?? value);
        const fits = fittingRules(full, hiddenIndex);
        expect(fits.length).toBeGreaterThan(0);
        expect(fits.every((rule) => rule.terms[hiddenIndex] === value)).toBe(true);
        // Polynomial sequences (constant or growing steps) also agree with finite differences.
        if (c.content.kind === 'add' || c.content.kind === 'growing-add') {
          if (hiddenIndex === full.length - 1) {
            expect(polynomialNext(full.slice(0, -1))).toBe(value);
          }
        }
      }
    }
  });

  it('makes rules harder and adds gaps across levels', () => {
    expectNonDecreasing(
      NUMBER_SEQUENCES_LEVELS,
      (p) => (Object.keys(p.rules).length > 1 ? 1 : 0),
      'mixed rules',
    );
    expect(NUMBER_SEQUENCES_LEVELS[1].missingShare).toBe(0);
    expect(NUMBER_SEQUENCES_LEVELS[10].missingShare).toBeGreaterThan(0.5);
  });
});
