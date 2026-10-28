import {
  describeGameContract,
  expectDistinctLevels,
  expectNonDecreasing,
} from '@/test/gameContract';
import { meanGenerationMs, sweep } from '../shared/testing';
import { numberComparisonGame } from './content/definition';
import { NUMBER_COMPARISON_LEVELS } from './content/levels';
import { evaluateLabel } from './content/quantities';
import { KIND_ORDER } from './content/types';
import { numberComparisonModule } from './index';
import { describeNumberOption } from './ui/numberOptions';

describeGameContract(numberComparisonModule);

const all = sweep(numberComparisonGame, 60);

describe('Number Comparison content', () => {
  it('marks the unique largest or smallest value as the answer (independent evaluation)', () => {
    for (const { challenge } of all) {
      const { response, content } = challenge;
      if (response.format !== 'single-choice') throw new Error('single-choice expected');
      const values = response.question.options.map((o) => ({
        id: o.id,
        v: evaluateLabel(o.label),
      }));
      const target =
        content.ask === 'largest'
          ? Math.max(...values.map((x) => x.v))
          : Math.min(...values.map((x) => x.v));
      const winners = values.filter((x) => Math.abs(x.v - target) < 1e-9);
      expect(winners).toHaveLength(1);
      expect(winners[0]?.id).toBe(response.solution.optionId);
    }
  });

  it('keeps each value consistent with its label and offers the level’s count', () => {
    for (const { level, challenge } of all) {
      const { items } = challenge.content;
      expect(items).toHaveLength(NUMBER_COMPARISON_LEVELS[level].optionCount);
      for (const q of items) expect(evaluateLabel(q.label)).toBeCloseTo(q.num / q.den, 9);
    }
  });

  it('shows decimals of different lengths and fractions with different denominators', () => {
    const decimals = all.filter(({ challenge }) => challenge.content.kind === 'decimals');
    const mixedLength = decimals.filter(({ challenge }) => {
      const lengths = challenge.content.items.map((q) => q.label.length);
      return new Set(lengths).size > 1;
    });
    expect(mixedLength.length / decimals.length).toBeGreaterThan(0.7);
    for (const { challenge } of all) {
      if (challenge.content.kind !== 'fractions') continue;
      expect(new Set(challenge.content.items.map((q) => q.den)).size).toBeGreaterThan(1);
    }
  });

  it('brings values closer, adds options and notations across levels', () => {
    expectDistinctLevels(NUMBER_COMPARISON_LEVELS);
    expectNonDecreasing(NUMBER_COMPARISON_LEVELS, (p) => p.optionCount, 'options');
    expectNonDecreasing(NUMBER_COMPARISON_LEVELS, (p) => p.digits, 'digits');
    expectNonDecreasing(NUMBER_COMPARISON_LEVELS, (p) => p.smallestShare, 'smallest share');
    expectNonDecreasing(
      NUMBER_COMPARISON_LEVELS,
      (p) => Math.max(...Object.keys(p.kinds).map((k) => KIND_ORDER.indexOf(k as never))),
      'notation',
    );
  });

  it('spells fractions and operators out for screen readers', () => {
    expect(describeNumberOption('3/4')).toBe('3 over 4');
    expect(describeNumberOption('61 − 4')).toBe('61 minus 4');
    expect(describeNumberOption('0.45')).toBeUndefined();
  });

  it('generates quickly', () => {
    expect(meanGenerationMs(numberComparisonGame)).toBeLessThan(5);
  });
});
