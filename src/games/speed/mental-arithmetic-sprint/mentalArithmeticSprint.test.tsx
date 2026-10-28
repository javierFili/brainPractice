import { render, screen } from '@testing-library/react';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import {
  describeGameContract,
  expectDistinctLevels,
  expectNonDecreasing,
} from '@/test/gameContract';
import { meanGenerationMs, sweep } from '../shared/testing';
import { mentalArithmeticSprintGame, VERDICTS } from './content/definition';
import { evaluateExpression } from './content/expressions';
import { ARITHMETIC_LEVELS } from './content/levels';
import { FAMILY_ORDER } from './content/types';
import { mentalArithmeticSprintModule } from './index';
import { ArithmeticView } from './ui/ArithmeticView';

describeGameContract(mentalArithmeticSprintModule);

const all = sweep(mentalArithmeticSprintGame, 60);

describe('Mental Arithmetic Sprint content', () => {
  it('computes every result exactly (independent evaluator) with whole, non-negative values', () => {
    for (const { challenge } of all) {
      const { expression, value } = challenge.content;
      expect(evaluateExpression(expression)).toBe(value);
      expect(Number.isInteger(value) && value >= 0).toBe(true);
    }
  });

  it('marks an equation true exactly when the shown result is the real one', () => {
    for (const { challenge } of all) {
      const { content, response } = challenge;
      if (content.kind === 'solve') {
        expect(response).toMatchObject({ format: 'numeric', solution: { value: content.value } });
        continue;
      }
      if (response.format !== 'single-choice') throw new Error('single-choice expected');
      const picked = response.question.options.find((o) => o.id === response.solution.optionId);
      expect(picked?.label).toBe(content.shown === content.value ? 'True' : 'False');
      expect(content.shown).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps True/False in a fixed order and about half of the equations true', () => {
    const verify = all.filter(({ challenge }) => challenge.content.kind === 'verify');
    for (const { challenge } of verify) {
      if (challenge.response.format !== 'single-choice') throw new Error('choice expected');
      expect(challenge.response.question.options.map((o) => o.label)).toEqual([...VERDICTS]);
    }
    const share =
      verify.filter(({ challenge }) => challenge.content.shown === challenge.content.value).length /
      verify.length;
    expect(share).toBeGreaterThan(0.4);
    expect(share).toBeLessThan(0.6);
  });

  it('uses only the operations of each level', () => {
    for (const { level, challenge } of all) {
      expect(ARITHMETIC_LEVELS[level].families).toContain(challenge.content.family);
    }
  });

  it('moves to harder operations and typed answers across levels', () => {
    expectDistinctLevels(ARITHMETIC_LEVELS);
    expectNonDecreasing(
      ARITHMETIC_LEVELS,
      (p) => Math.max(...p.families.map((f) => FAMILY_ORDER.indexOf(f))),
      'hardest operation',
    );
    expect(ARITHMETIC_LEVELS[1].kinds).toEqual({ verify: 1 });
    expect(ARITHMETIC_LEVELS[10].kinds).toEqual({ solve: 1 });
    for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const) {
      expect(ARITHMETIC_LEVELS[level].timing.limitMs).not.toBeNull();
    }
  });

  it('generates quickly', () => {
    expect(meanGenerationMs(mentalArithmeticSprintGame)).toBeLessThan(5);
  });
});

describe('Mental Arithmetic Sprint view', () => {
  it('hides the result of a typed question until the review', () => {
    const challenge = generateChallenge(mentalArithmeticSprintGame, { level: 3, seed: toSeed(5) });
    const props = { challenge, locate: null, respond: null, answer: null, assisted: false };
    const { unmount } = render(<ArithmeticView {...props} phase="respond" />);
    expect(screen.getByText(/equals what/)).toBeInTheDocument();
    unmount();
    render(<ArithmeticView {...props} phase="review" />);
    expect(screen.getByText(new RegExp(`equals ${challenge.content.value}$`))).toBeInTheDocument();
  });
});
