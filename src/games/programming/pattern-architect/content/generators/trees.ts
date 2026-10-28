import { singleChoice } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import {
  infer,
  mismatches,
  reorderings,
  searchPrograms,
  trace,
  withoutOneStep,
} from '../solvers/programSpace';
import {
  describeTreeOp,
  formatTree,
  TREE_OPS,
  TREE_SIBLINGS,
  TREE_SPACE,
  treeHeight,
} from '../solvers/treeOps';
import type { PatternProfile, TreeNode, TreeOp } from '../types';
import { pickDistractors, type PatternDraft } from './draft';
import { everyStepVisible, interleave } from './transforms';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const MAX_CHILDREN = 3;

/** Random ordered tree: each new item joins an earlier one; at least three levels deep. */
export function randomTree(random: RandomGenerator, labels: readonly string[]): TreeNode | null {
  const children: string[][] = labels.map(() => []);
  for (let i = 1; i < labels.length; i++) {
    const open = labels
      .slice(0, i)
      .flatMap((_, p) => ((children[p] as string[]).length < MAX_CHILDREN ? [p] : []));
    (children[pick(random, open)] as string[]).push(labels[i] as string);
  }
  const index = new Map(labels.map((label, i) => [label, i]));
  const build = (label: string): TreeNode => ({
    label,
    children: (children[index.get(label) as number] as string[]).map(build),
  });
  const tree = build(labels[0] as string);
  return treeHeight(tree) >= 2 && tree.children.length >= 2 ? tree : null;
}

const run = (program: readonly TreeOp[], tree: TreeNode) =>
  trace(TREE_SPACE, program, tree).at(-1) as TreeNode;

export function treeAnalogy(random: RandomGenerator, profile: PatternProfile): PatternDraft {
  const { elementCount, depth, operations, maxExamples } = profile.tree;
  return retryGeneration('tree analogy', () => {
    const program = Array.from({ length: depth }, () => pick(random, operations));
    if (program.some((op, i) => i > 0 && program[i - 1] === op)) return null;
    // Disjoint letters per tree, so the analogy is about structure, not about names.
    const letters = sample(random, LETTERS, LETTERS.length);
    const trees: TreeNode[] = [];
    for (let i = 0; i <= maxExamples; i++) {
      const size = randomInt(random, elementCount - 1, elementCount);
      const tree = randomTree(random, letters.slice(i * 7, i * 7 + size));
      if (tree === null) return null;
      trees.push(tree);
    }
    const outputs = trees.map((tree) => run(program, tree));
    if (outputs.some((o, i) => formatTree(o) === formatTree(trees[i] as TreeNode))) return null;
    const questionIndex = maxExamples;
    const question = trees[questionIndex] as TreeNode;
    const answer = outputs[questionIndex] as TreeNode;
    if (!everyStepVisible(trace(TREE_SPACE, program, question).map(formatTree))) return null;
    const expected = outputs.map(formatTree);
    const behaviours = searchPrograms(TREE_SPACE, trees, expected.slice(0, 1), depth);
    for (let shown = 1; shown <= maxExamples; shown++) {
      const shownKeys = expected.slice(0, shown);
      const { predictions, shortest } = infer(behaviours, shownKeys, questionIndex);
      if (shortest < depth || predictions.size !== 1) continue;
      const outputsOf = (programs: readonly (readonly TreeOp[])[]) =>
        programs.map((p) => formatTree(run(p, question)));
      const swapped = program.flatMap((op, i) =>
        TREE_SIBLINGS[op].map((s) => [...program.slice(0, i), s, ...program.slice(i + 1)]),
      );
      const nearMisses = behaviours
        .filter((b) => mismatches(b, shownKeys) === 1)
        .map((b) => b.keys[questionIndex] as string);
      const wrong = pickDistractors(
        formatTree(answer),
        interleave([
          outputsOf(reorderings(program)),
          outputsOf(withoutOneStep(program)),
          outputsOf(swapped),
          nearMisses,
          outputsOf(TREE_OPS.map((op) => [op])),
        ]),
        profile.distractors,
      );
      if (wrong === null) return null;
      const steps = program.map((op, i) => `${i + 1}) ${describeTreeOp(op)}`).join('; ');
      return {
        prompt:
          'The same restructuring rule turns each tree on the left into the tree on the right. What does the new tree become?',
        content: {
          kind: 'tree-analogy',
          examples: trees
            .slice(0, shown)
            .map((before, i) => ({ before, after: outputs[i] as TreeNode })),
          question,
          maxSteps: depth,
        },
        response: singleChoice(random, formatTree(answer), wrong),
        explanation: `The rule: ${steps}. So ${formatTree(question)} becomes ${formatTree(answer)}. Every rule of up to ${depth} step${depth === 1 ? '' : 's'} that fits the examples gives this same tree.`,
        skills: ['abstraction', 'decomposition', 'pattern-recognition'],
      };
    }
    return null;
  });
}
