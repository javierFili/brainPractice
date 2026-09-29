import { solveGrid } from '../solvers/grid';
import { degreeProfile, findIsomorphism, isomorphic } from '../solvers/isomorphism';
import { applyListOp, formatList, LIST_SPACE } from '../solvers/listOps';
import { enumerateBehaviours, infer, searchPrograms } from '../solvers/programSpace';
import { consistentRules, determinedNext } from '../solvers/sequences';
import { applyTreeOp, formatTree } from '../solvers/treeOps';
import type { Digraph, GridCell, TreeNode } from '../types';
import { canonicalForm, sequencePredictions } from './bruteForce';

describe('sequence solver', () => {
  it('continues a sequence when every fitting rule agrees', () => {
    expect(determinedNext([3, 7, 11, 15, 19])).toBe(23);
    expect(determinedNext([2, 5, 4, 7, 6, 9])).toBe(8);
    expect(determinedNext([1, 1, 2, 3, 5, 8])).toBe(13);
  });

  it('refuses short sequences that several rules explain differently', () => {
    // 1, 2, 4: doubling gives 8, a step growing by one gives 7.
    expect(new Set(consistentRules([1, 2, 4]).map((h) => h.next)).size).toBeGreaterThan(1);
    expect(determinedNext([1, 2, 4])).toBeNull();
    expect(sequencePredictions([1, 2, 4]).size).toBeGreaterThan(1);
  });
});

describe('grid solver', () => {
  const cell = (shape: GridCell['shape'], count: number): GridCell => ({ shape, count });

  it('solves shapes and counts independently', () => {
    const cells = [
      [cell('circle', 1), cell('square', 2), cell('star', 3)],
      [cell('square', 1), cell('star', 2), cell('circle', 3)],
      [cell('star', 1), null, cell('square', 3)],
    ];
    expect(solveGrid(cells)).toEqual(cell('circle', 2));
  });

  it('solves arithmetic counts wherever the gap is', () => {
    const cells = [
      [cell('circle', 1), cell('circle', 2), cell('circle', 3)],
      [cell('circle', 2), null, cell('circle', 5)],
      [cell('circle', 1), cell('circle', 1), cell('circle', 2)],
    ];
    expect(solveGrid(cells)).toEqual(cell('circle', 3));
  });
});

describe('program search', () => {
  it('applies list steps as described', () => {
    expect(applyListOp({ op: 'swap-pairs' }, [1, 2, 3, 4, 5])).toEqual([2, 1, 4, 3, 5]);
    expect(applyListOp({ op: 'remove-repeats' }, [3, 1, 3, 2, 1])).toEqual([3, 1, 2]);
    expect(applyListOp({ op: 'running-total' }, [1, 2, 3])).toEqual([1, 3, 6]);
    expect(applyListOp({ op: 'rotate-right' }, [1, 2, 3])).toEqual([3, 1, 2]);
  });

  it('detects when one example leaves the answer open', () => {
    // [1, 2, 3] → [3, 2, 1] fits both "reverse" and "sort from largest to smallest".
    const inputs = [
      [1, 2, 3],
      [2, 9, 4],
    ];
    const behaviours = enumerateBehaviours(LIST_SPACE, inputs, 1);
    const { predictions } = infer(behaviours, [formatList([3, 2, 1])], 1);
    expect([...predictions.keys()].sort()).toEqual(['[4, 9, 2]', '[9, 4, 2]']);
  });

  it('pruned search finds the same consistent behaviours as the full enumeration', () => {
    const inputs = [
      [4, 1, 3],
      [2, 7, 5, 6],
      [9, 0, 8],
    ];
    // Produced by: sort from smallest to largest, add 2, move the first item to the end.
    const required = [formatList([5, 6, 3]), formatList([7, 8, 9, 4])];
    const full = infer(enumerateBehaviours(LIST_SPACE, inputs, 3), required, 2).predictions;
    const pruned = infer(searchPrograms(LIST_SPACE, inputs, required, 3), required, 2).predictions;
    expect([...pruned.keys()].sort()).toEqual([...full.keys()].sort());
    expect(full.has('[10, 11, 2]')).toBe(true);
  });

  it('restructures trees as described', () => {
    const tree: TreeNode = {
      label: 'a',
      children: [
        {
          label: 'c',
          children: [
            { label: 'd', children: [] },
            { label: 'b', children: [] },
          ],
        },
        { label: 'e', children: [] },
      ],
    };
    expect(formatTree(tree)).toBe('a(c(d, b), e)');
    expect(formatTree(applyTreeOp('mirror', tree))).toBe('a(e, c(b, d))');
    expect(formatTree(applyTreeOp('mirror-top', tree))).toBe('a(e, c(d, b))');
    expect(formatTree(applyTreeOp('prune-leaves', tree))).toBe('a(c)');
    expect(formatTree(applyTreeOp('flatten', tree))).toBe('a(c, d, b, e)');
    expect(formatTree(applyTreeOp('sort-children', tree))).toBe('a(c(b, d), e)');
    expect(formatTree(applyTreeOp('rotate-top', tree))).toBe('a(e, c(d, b))');
  });
});

describe('isomorphism', () => {
  const graph = (edges: [string, string][]): Digraph => ({
    nodes: [...new Set(edges.flat())].sort(),
    edges,
  });
  const reference = graph([
    ['a', 'b'],
    ['a', 'c'],
    ['b', 'd'],
    ['c', 'd'],
    ['d', 'e'],
  ]);

  it('finds a renaming for the same structure under other names', () => {
    const renamed = graph([
      ['5', '3'],
      ['5', '1'],
      ['3', '2'],
      ['1', '2'],
      ['2', '4'],
    ]);
    const mapping = findIsomorphism(reference, renamed);
    expect(mapping?.get('a')).toBe('5');
    expect(mapping?.get('d')).toBe('2');
    expect(canonicalForm(reference)).toBe(canonicalForm(renamed));
  });

  it('rejects look-alikes with identical arrow counts per node', () => {
    // Same (incoming, outgoing) counts as the reference, but the start points at the merge node.
    const lookAlike = graph([
      ['a', 'b'],
      ['a', 'd'],
      ['b', 'c'],
      ['c', 'd'],
      ['d', 'e'],
    ]);
    expect(degreeProfile(lookAlike)).toBe(degreeProfile(reference));
    expect(isomorphic(reference, lookAlike)).toBe(false);
    expect(canonicalForm(reference)).not.toBe(canonicalForm(lookAlike));
  });
});
