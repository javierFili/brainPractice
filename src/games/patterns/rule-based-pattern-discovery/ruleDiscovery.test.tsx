import {
  describeGameContract,
  expectDistinctLevels,
  expectNonDecreasing,
} from '@/test/gameContract';
import { gridKey, parseGrid } from '../shared/content';
import {
  expectFastGeneration,
  expectNoCentroidBias,
  generateMany,
  gridDistance,
  optionLabels,
  solutionLabel,
} from '../shared/testing';
import { consistentOutputs, ruleDiscoveryGame } from './content/definition';
import { RULE_DISCOVERY_LEVELS } from './content/levels';
import { applyChain, ruleLibrary } from './content/rules';
import { ruleDiscoveryModule } from './index';

describeGameContract(ruleDiscoveryModule);

describe('Rule rules', () => {
  const grid = [
    [1, 0, 0],
    [0, 2, 0],
    [1, 0, 0],
  ];
  const rule = (id: string) => {
    const found = ruleLibrary([1, 2]).find((r) => r.id === id);
    if (!found) throw new Error(id);
    return found;
  };
  it('applies each rule as described', () => {
    expect(gridKey(applyChain([rule('fall')], grid))).toBe('··· / ■·· / ■●·');
    expect(gridKey(applyChain([rule('flip-lr')], grid))).toBe('··■ / ·●· / ··■');
    expect(gridKey(applyChain([rule('shift-right')], grid))).toBe('·■· / ··● / ·■·');
    expect(gridKey(applyChain([rule('fill-rows')], grid))).toBe('■■■ / ●●● / ■■■');
    expect(gridKey(applyChain([rule('swap-1-2')], grid))).toBe('●·· / ·■· / ●··');
    expect(gridKey(applyChain([rule('cw'), rule('recolour-2-3')], grid))).toBe('■·■ / ·◆· / ···');
  });
});

describe('Rule-Based Pattern Discovery', () => {
  const all = generateMany(ruleDiscoveryGame, 30);

  it('has exactly one output that every fitting rule agrees on', () => {
    for (const { challenge } of all) {
      const outputs = consistentOutputs(challenge.content);
      expect(outputs).toHaveLength(1);
      expect(solutionLabel(challenge)).toBe(outputs[0]);
      const labels = optionLabels(challenge);
      expect(new Set(labels).size).toBe(labels.length);
      for (const label of labels) expect(parseGrid(label)).not.toBeNull();
    }
  });

  it('does not reward picking the grid most similar to the others', () => {
    expectNoCentroidBias(
      all.map((e) => e.challenge),
      gridDistance,
    );
  });

  it('raises the load across levels', () => {
    expectDistinctLevels(RULE_DISCOVERY_LEVELS);
    expectNonDecreasing(RULE_DISCOVERY_LEVELS, (p) => p.options, 'options');
    expectNonDecreasing(
      RULE_DISCOVERY_LEVELS,
      (p) => (p.secondFamilies.length > 0 ? 2 : 1),
      'steps',
    );
    expectNonDecreasing(RULE_DISCOVERY_LEVELS, (p) => p.timing.targetMs, 'target time');
  });

  it('generates quickly', () => {
    expectFastGeneration(ruleDiscoveryGame);
  });
});
