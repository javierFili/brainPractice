import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { conditionalReasoningGame, VERDICT_LABELS } from './content/definition';
import { CONDITIONAL_LEVELS } from './content/levels';
import type { Literal, Premise } from './content/types';
import { conditionalReasoningModule } from './index';

describeGameContract(conditionalReasoningModule);

/** Independent oracle: material implication evaluated world by world, written separately. */
function oracle(atoms: number, premises: readonly Premise[], q: Literal) {
  const is = (l: Literal, w: number) => (((w >> l.atom) & 1) === 1) === l.value;
  const ok = (p: Premise, w: number) =>
    p.type === 'fact'
      ? is(p.lit, w)
      : p.type === 'or'
        ? is(p.a, w) || is(p.b, w)
        : p.type === 'unless'
          ? is(p.main, w) || is(p.cond, w)
          : !is(p.a, w) || is(p.b, w);
  const worlds = [...Array(2 ** atoms).keys()].filter((w) => premises.every((p) => ok(p, w)));
  const values = new Set(worlds.map((w) => is(q, w)));
  return worlds.length === 0
    ? 'inconsistent'
    : values.size === 2
      ? 'unknown'
      : values.has(true)
        ? 'true'
        : 'false';
}

describe('Conditional Reasoning', () => {
  it('answers match an independent truth-table oracle at every level', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const seen = new Set<string>();
      for (const seed of contractSeeds(30, 5)) {
        const c = generateChallenge(conditionalReasoningGame, { level, seed });
        const { response } = c;
        if (response.format !== 'single-choice') throw new Error('single-choice expected');
        const answer = response.question.options.find((o) => o.id === response.solution.optionId);
        const expected = oracle(c.content.atoms.length, c.content.premises, c.content.question);
        expect(expected).not.toBe('inconsistent');
        expect(answer?.label).toEqual(VERDICT_LABELS[expected as 'true']);
        seen.add(expected);
      }
      expect(seen.size).toBe(CONDITIONAL_LEVELS[level].verdicts.length);
    }
  });

  it('modus ponens, modus tollens and both fallacies get the classic verdicts', () => {
    const rule: Premise = { type: 'if', a: { atom: 0, value: true }, b: { atom: 1, value: true } };
    const fact = (atom: number, value: boolean): Premise => ({
      type: 'fact',
      lit: { atom, value },
    });
    expect(oracle(2, [rule, fact(0, true)], { atom: 1, value: true })).toBe('true');
    expect(oracle(2, [rule, fact(1, false)], { atom: 0, value: true })).toBe('false');
    expect(oracle(2, [rule, fact(1, true)], { atom: 0, value: true })).toBe('unknown');
    expect(oracle(2, [rule, fact(0, false)], { atom: 1, value: true })).toBe('unknown');
  });

  it('adds rules and sentences across levels', () => {
    expectNonDecreasing(CONDITIONAL_LEVELS, (p) => p.chainLength, 'rules');
    expectNonDecreasing(CONDITIONAL_LEVELS, (p) => p.verdicts.length, 'verdicts');
    expectNonDecreasing(CONDITIONAL_LEVELS, (p) => p.atoms, 'atoms');
  });
});
