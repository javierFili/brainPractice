import { parseFigure, figureLabel } from '../shared/content';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import {
  expectFastGeneration,
  expectNoCentroidBias,
  figureDistance,
  generateMany,
  optionLabels,
  solutionLabel,
} from '../shared/testing';
import { solveRow, visualPatternGame } from './content/definition';
import { VISUAL_PATTERN_LEVELS } from './content/levels';
import { visualPatternModule } from './index';

describeGameContract(visualPatternModule);

describe('Visual Pattern Completion', () => {
  const all = generateMany(visualPatternGame);

  it('has exactly one option that continues the row, at every level', () => {
    for (const { challenge } of all) {
      const next = solveRow(challenge.content.items);
      if (next === null) throw new Error('ambiguous row');
      const labels = optionLabels(challenge);
      expect(labels.filter((l) => l === figureLabel(next))).toHaveLength(1);
      expect(solutionLabel(challenge)).toBe(figureLabel(next));
      for (const label of labels) expect(parseFigure(label)).not.toBeNull();
    }
  });

  it('does not reward picking the option most similar to the others', () => {
    expectNoCentroidBias(
      all.map((e) => e.challenge),
      figureDistance,
    );
  });

  it('raises the load across levels', () => {
    expectNonDecreasing(VISUAL_PATTERN_LEVELS, (p) => p.options, 'options');
    expectNonDecreasing(VISUAL_PATTERN_LEVELS, (p) => p.timing.targetMs, 'target time');
  });

  it('generates quickly', () => {
    expectFastGeneration(visualPatternGame);
  });
});
