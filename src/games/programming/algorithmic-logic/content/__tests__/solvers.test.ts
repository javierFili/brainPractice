import { mulberry32, toSeed } from '@/domain/random';
import { en } from '@/test/i18n';
import { describeRule, permutations, satisfies, solutions } from '../solvers/constraints';
import {
  ancestors,
  criticalPath,
  criticalPathLength,
  isValidOrder,
  randomTopologicalOrder,
  violatedEdges,
} from '../solvers/graph';
import type { ConstraintRule, TaskGraph } from '../types';

//   a → b → d
//   a → c → d → e
const diamond: TaskGraph = {
  nodes: ['a', 'b', 'c', 'd', 'e'],
  edges: [
    ['a', 'b'],
    ['a', 'c'],
    ['b', 'd'],
    ['c', 'd'],
    ['d', 'e'],
  ],
};

describe('graph solvers', () => {
  it('validates execution orders', () => {
    expect(isValidOrder(diamond, ['a', 'c', 'b', 'd', 'e'])).toBe(true);
    expect(isValidOrder(diamond, ['a', 'b', 'd', 'c', 'e'])).toBe(false);
    expect(isValidOrder(diamond, ['a', 'b', 'c', 'd'])).toBe(false);
    expect(isValidOrder(diamond, ['a', 'a', 'b', 'c', 'd'])).toBe(false);
    expect(isValidOrder(diamond, ['a', 'b', 'c', 'd', 'z'])).toBe(false);
  });

  it('lists the violated edges', () => {
    expect(violatedEdges(diamond, ['a', 'b', 'd', 'c', 'e'])).toEqual([['c', 'd']]);
  });

  it('collects transitive prerequisites', () => {
    expect([...ancestors(diamond, 'e')].sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(ancestors(diamond, 'a').size).toBe(0);
  });

  it('produces only valid random topological orders and detects cycles', () => {
    for (let seed = 0; seed < 50; seed++) {
      expect(isValidOrder(diamond, randomTopologicalOrder(diamond, mulberry32(toSeed(seed))))).toBe(
        true,
      );
    }
    const cyclic: TaskGraph = {
      nodes: ['a', 'b'],
      edges: [
        ['a', 'b'],
        ['b', 'a'],
      ],
    };
    expect(() => randomTopologicalOrder(cyclic, mulberry32(toSeed(1)))).toThrow(/cycle/);
  });

  it('computes the critical path with unit and weighted durations', () => {
    expect(criticalPathLength(diamond)).toBe(4);
    const weighted = { ...diamond, durations: { a: 1, b: 5, c: 1, d: 1, e: 2 } };
    expect(criticalPathLength(weighted)).toBe(9);
    expect(criticalPath(weighted)).toEqual(['a', 'b', 'd', 'e']);
  });
});

describe('constraint solvers', () => {
  const order = ['x', 'y', 'z'];
  it.each<[ConstraintRule, boolean]>([
    [{ type: 'before', a: 'x', b: 'z' }, true],
    [{ type: 'before', a: 'z', b: 'x' }, false],
    [{ type: 'immediately-before', a: 'x', b: 'y' }, true],
    [{ type: 'immediately-before', a: 'x', b: 'z' }, false],
    [{ type: 'not-adjacent', a: 'x', b: 'z' }, true],
    [{ type: 'not-adjacent', a: 'x', b: 'y' }, false],
    [{ type: 'at', a: 'y', position: 2 }, true],
    [{ type: 'not-at', a: 'y', position: 2 }, false],
  ])('evaluates %j → %s', (rule, expected) => {
    expect(satisfies(rule, order)).toBe(expected);
    expect(en(describeRule(rule))).toMatch(/deployed/);
  });

  it('enumerates every permutation exactly once', () => {
    const all = permutations(['a', 'b', 'c', 'd']);
    expect(all).toHaveLength(24);
    expect(new Set(all.map((p) => p.join())).size).toBe(24);
    expect(permutations(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toHaveLength(5040);
  });

  it('finds all solutions', () => {
    const rules: ConstraintRule[] = [
      { type: 'before', a: 'x', b: 'y' },
      { type: 'not-at', a: 'z', position: 1 },
    ];
    expect(solutions(order, rules).map((p) => p.join(''))).toEqual(
      expect.arrayContaining(['xyz', 'xzy']),
    );
    expect(solutions(order, rules)).toHaveLength(2);
  });
});
