import {
  describeGameContract,
  expectDistinctLevels,
  expectNonDecreasing,
} from '@/test/gameContract';
import type { Figure } from '../shared/content';
import { expectFastGeneration, generateMany, solutionLabel } from '../shared/testing';
import { abstractPatternGame } from './content/definition';
import { ABSTRACT_LEVELS } from './content/levels';
import { oddPanels, PANEL_LIBRARY } from './content/rules';
import type { AbstractChallenge } from './content/types';
import { abstractPatternModule } from './index';

describeGameContract(abstractPatternModule);

const answerOf = (c: AbstractChallenge) => Number(solutionLabel(c).replace('Panel ', '')) - 1;

/** Expected hit rate of always picking among the panels with the highest `score`. */
function heuristicRate(
  challenges: readonly AbstractChallenge[],
  score: (panel: readonly Figure[]) => number,
) {
  const total = challenges.reduce((sum, c) => {
    const scores = c.content.panels.map(score);
    const best = Math.max(...scores);
    const winners = scores.flatMap((s, i) => (s === best ? [i] : []));
    return sum + (winners.includes(answerOf(c)) ? 1 / winners.length : 0);
  }, 0);
  return total / challenges.length;
}

const chance = (challenges: readonly AbstractChallenge[]) =>
  challenges.reduce((sum, c) => sum + 1 / c.content.panels.length, 0) / challenges.length;

describe('Abstract Pattern Challenge', () => {
  const all = generateMany(abstractPatternGame, 60).map((e) => e.challenge);

  it('has exactly one panel that any rule of the library singles out', () => {
    for (const c of all) {
      const answer = answerOf(c);
      expect([...oddPanels(c.content.panels)]).toEqual([answer]);
      // Independent re-check: some predicate is shared by every other panel and broken by it.
      const explaining = PANEL_LIBRARY.filter((p) =>
        c.content.panels.every((panel, i) => p.holds(panel) === (i !== answer)),
      );
      expect(explaining.length).toBeGreaterThan(0);
    }
  });

  it('places the odd panel anywhere with equal chance', () => {
    const positions = all.map(answerOf);
    const firsts = positions.filter((p) => p === 0).length / positions.length;
    expect(firsts).toBeLessThan(chance(all) * 1.6);
  });

  it('does not give the odd panel away by surface features unrelated to the rule', () => {
    const notCount = all.filter((c) => c.content.kind !== 'count');
    const notColour = all.filter((c) => c.content.kind !== 'colour' && c.content.kind !== 'count');
    const notShape = all.filter(
      (c) => c.content.kind !== 'shape' && c.content.kind !== 'order' && c.content.kind !== 'count',
    );
    const colours = (p: readonly Figure[]) => new Set(p.map((f) => f.color)).size;
    const shapes = (p: readonly Figure[]) => new Set(p.map((f) => f.shape)).size;
    const checks: [AbstractChallenge[], (p: readonly Figure[]) => number][] = [
      [notCount, (p) => p.length],
      [notCount, (p) => -p.length],
      [notColour, colours],
      [notColour, (p) => -colours(p)],
      [notShape, shapes],
      [notShape, (p) => -shapes(p)],
    ];
    for (const [set, score] of checks) {
      expect(set.length).toBeGreaterThan(100);
      expect(heuristicRate(set, score)).toBeLessThan(chance(set) + 0.06);
    }
  });

  it('adds panels and figures across levels', () => {
    expectNonDecreasing(ABSTRACT_LEVELS, (p) => p.panels, 'panels');
    expectNonDecreasing(ABSTRACT_LEVELS, (p) => p.maxFigures, 'figures');
    expectNonDecreasing(ABSTRACT_LEVELS, (p) => p.timing.targetMs, 'target time');
    expectDistinctLevels(ABSTRACT_LEVELS);
  });

  it('generates quickly', () => {
    expectFastGeneration(abstractPatternGame);
  });
});
