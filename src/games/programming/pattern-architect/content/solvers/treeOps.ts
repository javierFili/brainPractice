import { msg, type Message } from '@/domain/shared';
import type { TreeNode, TreeOp } from '../types';
import type { ProgramSpace } from './programSpace';

const node = (label: string, children: readonly TreeNode[]): TreeNode => ({ label, children });

function preorder(tree: TreeNode): TreeNode[] {
  return tree.children.flatMap((child) => [child, ...preorder(child)]);
}

export function applyTreeOp(op: TreeOp, tree: TreeNode): TreeNode {
  switch (op) {
    case 'mirror': {
      const mirror = (t: TreeNode): TreeNode =>
        node(t.label, [...t.children].reverse().map(mirror));
      return mirror(tree);
    }
    case 'mirror-top':
      return node(tree.label, [...tree.children].reverse());
    case 'rotate-top':
      return tree.children.length === 0
        ? tree
        : node(tree.label, [...tree.children.slice(1), tree.children[0] as TreeNode]);
    case 'prune-leaves': {
      const prune = (t: TreeNode): TreeNode =>
        node(t.label, t.children.filter((c) => c.children.length > 0).map(prune));
      return prune(tree);
    }
    case 'flatten':
      return node(
        tree.label,
        preorder(tree).map((t) => node(t.label, [])),
      );
    case 'sort-children': {
      const sort = (t: TreeNode): TreeNode =>
        node(t.label, [...t.children].sort((a, b) => a.label.localeCompare(b.label)).map(sort));
      return sort(tree);
    }
  }
}

export const TREE_OPS: readonly TreeOp[] = [
  'mirror',
  'mirror-top',
  'rotate-top',
  'prune-leaves',
  'flatten',
  'sort-children',
];

/** `a(b, c(d))`: a contains b and c, in that order; c contains d. */
export const formatTree = (tree: TreeNode): string =>
  tree.children.length === 0
    ? tree.label
    : `${tree.label}(${tree.children.map(formatTree).join(', ')})`;

export const TREE_SPACE: ProgramSpace<TreeNode, TreeOp> = {
  operations: TREE_OPS,
  apply: applyTreeOp,
  key: formatTree,
};

export const treeSize = (tree: TreeNode): number =>
  1 + tree.children.reduce((sum, child) => sum + treeSize(child), 0);

export const treeHeight = (tree: TreeNode): number =>
  tree.children.length === 0 ? 0 : 1 + Math.max(...tree.children.map(treeHeight));

const TREE_OP_KEYS: Readonly<Record<TreeOp, string>> = {
  mirror: 'mirror',
  'mirror-top': 'mirrorTop',
  'rotate-top': 'rotateTop',
  'prune-leaves': 'pruneLeaves',
  flatten: 'flatten',
  'sort-children': 'sortChildren',
};

export const describeTreeOp = (op: TreeOp): Message =>
  msg(`programming:patternArchitect.treeOp.${TREE_OP_KEYS[op]}`);

/** Look-alike restructurings, for "almost the right step" distractors. */
export const TREE_SIBLINGS: Readonly<Record<TreeOp, readonly TreeOp[]>> = {
  mirror: ['mirror-top', 'sort-children'],
  'mirror-top': ['mirror', 'rotate-top'],
  'rotate-top': ['mirror-top'],
  'prune-leaves': ['flatten'],
  flatten: ['prune-leaves'],
  'sort-children': ['mirror'],
};
