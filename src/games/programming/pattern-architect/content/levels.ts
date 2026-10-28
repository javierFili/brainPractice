import type { LevelTable } from '@/domain/difficulty';
import type { GridRule, ListOpName, PatternProfile, TreeOp } from './types';

const seconds = (limit: number, target: number) => ({
  studyMs: null,
  limitMs: limit * 1000,
  targetMs: target * 1000,
});

const CATEGORICAL: readonly GridRule[] = ['by-row', 'by-column', 'shift-left', 'shift-right'];
const ARITHMETIC: readonly GridRule[] = ['row-step', 'column-step', 'row-sum', 'column-sum'];

/** Order-and-arithmetic steps: each is visible on a single example. */
const BASIC_STEPS: readonly ListOpName[] = [
  'reverse',
  'sort-ascending',
  'rotate-left',
  'rotate-right',
  'drop-first',
  'drop-last',
  'add',
  'double',
  'keep-even',
  'keep-odd',
];
/** Adds steps whose effect depends on the data (repeats, pairs, running totals). */
const ALL_STEPS: readonly ListOpName[] = [
  ...BASIC_STEPS,
  'sort-descending',
  'duplicate-each',
  'take-first',
  'swap-pairs',
  'remove-repeats',
  'running-total',
];
const ALL_TREE_OPS: readonly TreeOp[] = [
  'mirror',
  'mirror-top',
  'rotate-top',
  'prune-leaves',
  'flatten',
  'sort-children',
];

// Sub-profiles of kinds that are not active at a level still hold sensible values, so every
// profile has the same shape and moving a kind between levels is a one-line change.
const EARLY_TRANSFORM = { depth: 1, primitives: BASIC_STEPS, elementCount: 4, maxExamples: 3 };
const EARLY_STRUCTURE = {
  elementCount: 5,
  arrowCount: 5,
  distractorMutation: 'rewire',
} as const;
const EARLY_TREE = { elementCount: 6, depth: 1, operations: ALL_TREE_OPS, maxExamples: 2 };

/**
 * Level design for Pattern Architect (rationale per level in docs/game-design/pattern-architect.md).
 * Numbers stay small everywhere; difficulty grows by composing rules (1 → 3 operations), by
 * moving from visible regularities to hidden programs and structures, and by showing fewer clues.
 */
export const PATTERN_LEVELS: LevelTable<PatternProfile> = {
  1: {
    level: 1,
    tier: 'fundamentals',
    objective: 'Spot a single regularity: a constant step, or one attribute changing in a grid.',
    challengeCount: 6,
    timing: seconds(60, 20),
    kinds: { 'number-sequence': 1, 'symbol-grid': 1 },
    abstractionLevel: 1,
    complexity: 1,
    distractors: 3,
    sequence: { families: ['constant-step', 'alternating-steps'], sequenceLength: 5 },
    grid: {
      size: 3,
      varyingAttributes: 1,
      shapeRules: CATEGORICAL,
      countRules: ['by-row', 'by-column'],
    },
    transform: EARLY_TRANSFORM,
    structure: EARLY_STRUCTURE,
    tree: EARLY_TREE,
  },
  2: {
    level: 2,
    tier: 'fundamentals',
    objective: 'Steps that change and grids where two attributes follow separate rules.',
    challengeCount: 6,
    timing: seconds(75, 25),
    kinds: { 'number-sequence': 1, 'symbol-grid': 1 },
    abstractionLevel: 1,
    complexity: 2,
    distractors: 3,
    sequence: {
      families: ['alternating-steps', 'growing-step', 'multiply'],
      sequenceLength: 5,
    },
    grid: {
      size: 3,
      varyingAttributes: 2,
      shapeRules: CATEGORICAL,
      countRules: ['by-row', 'by-column'],
    },
    transform: EARLY_TRANSFORM,
    structure: EARLY_STRUCTURE,
    tree: EARLY_TREE,
  },
  3: {
    level: 3,
    tier: 'fundamentals',
    objective: 'Two sequences woven together, and grids whose counts follow arithmetic.',
    challengeCount: 6,
    timing: seconds(90, 30),
    kinds: { 'number-sequence': 1, 'symbol-grid': 1 },
    abstractionLevel: 2,
    complexity: 2,
    distractors: 3,
    sequence: {
      families: ['growing-step', 'multiply', 'interleaved', 'alternating-steps'],
      sequenceLength: 6,
    },
    grid: { size: 3, varyingAttributes: 2, shapeRules: CATEGORICAL, countRules: ARITHMETIC },
    transform: EARLY_TRANSFORM,
    structure: EARLY_STRUCTURE,
    tree: EARLY_TREE,
  },
  4: {
    level: 4,
    tier: 'intermediate',
    objective: 'Infer a hidden one-step program from input → output examples.',
    challengeCount: 8,
    timing: seconds(90, 35),
    kinds: { 'number-sequence': 1, 'symbol-grid': 1, 'transform-inference': 1.5 },
    abstractionLevel: 2,
    complexity: 2,
    distractors: 3,
    sequence: {
      families: ['interleaved', 'step-cycle', 'multiply-add', 'growing-step'],
      sequenceLength: 7,
    },
    grid: {
      size: 4,
      varyingAttributes: 2,
      shapeRules: CATEGORICAL,
      countRules: [...CATEGORICAL, ...ARITHMETIC],
    },
    transform: EARLY_TRANSFORM,
    structure: EARLY_STRUCTURE,
    tree: EARLY_TREE,
  },
  5: {
    level: 5,
    tier: 'intermediate',
    objective: 'Programs of two chained steps: separate what each step contributes.',
    challengeCount: 8,
    timing: seconds(120, 45),
    kinds: { 'number-sequence': 1, 'symbol-grid': 1, 'transform-inference': 2 },
    abstractionLevel: 3,
    complexity: 2,
    distractors: 3,
    sequence: {
      families: ['step-cycle', 'multiply-add', 'sum-of-previous-two', 'alternating-ops'],
      sequenceLength: 7,
    },
    grid: {
      size: 4,
      varyingAttributes: 2,
      shapeRules: CATEGORICAL,
      countRules: [...CATEGORICAL, ...ARITHMETIC],
    },
    transform: { depth: 2, primitives: BASIC_STEPS, elementCount: 4, maxExamples: 4 },
    structure: EARLY_STRUCTURE,
    tree: EARLY_TREE,
  },
  6: {
    level: 6,
    tier: 'intermediate',
    objective: 'Data-dependent steps (repeats, pairs, running totals) with fewer examples.',
    challengeCount: 8,
    timing: seconds(120, 50),
    kinds: { 'number-sequence': 1, 'symbol-grid': 1, 'transform-inference': 2 },
    abstractionLevel: 3,
    complexity: 2,
    distractors: 3,
    sequence: {
      families: ['step-cycle', 'multiply-add', 'alternating-ops', 'interleaved'],
      sequenceLength: 7,
    },
    grid: {
      size: 4,
      varyingAttributes: 2,
      shapeRules: CATEGORICAL,
      countRules: ARITHMETIC,
    },
    transform: { depth: 2, primitives: ALL_STEPS, elementCount: 5, maxExamples: 3 },
    structure: EARLY_STRUCTURE,
    tree: EARLY_TREE,
  },
  7: {
    level: 7,
    tier: 'advanced',
    objective: 'Structure over content: match graphs by shape and restructure trees by analogy.',
    challengeCount: 8,
    timing: seconds(150, 60),
    kinds: { 'transform-inference': 1.5, 'structure-match': 1, 'tree-analogy': 1 },
    abstractionLevel: 4,
    complexity: 2,
    distractors: 3,
    sequence: { families: ['alternating-ops', 'step-cycle'], sequenceLength: 7 },
    grid: { size: 4, varyingAttributes: 2, shapeRules: CATEGORICAL, countRules: ARITHMETIC },
    transform: { depth: 2, primitives: ALL_STEPS, elementCount: 5, maxExamples: 3 },
    structure: { elementCount: 5, arrowCount: 5, distractorMutation: 'rewire' },
    tree: { elementCount: 6, depth: 1, operations: ALL_TREE_OPS, maxExamples: 2 },
  },
  8: {
    level: 8,
    tier: 'advanced',
    objective: 'Three-step programs, bigger graphs and tree rules from a single example.',
    challengeCount: 8,
    timing: seconds(180, 75),
    kinds: { 'transform-inference': 1.5, 'structure-match': 1, 'tree-analogy': 1 },
    abstractionLevel: 4,
    complexity: 3,
    distractors: 3,
    sequence: { families: ['alternating-ops', 'step-cycle'], sequenceLength: 7 },
    grid: { size: 4, varyingAttributes: 2, shapeRules: CATEGORICAL, countRules: ARITHMETIC },
    transform: { depth: 3, primitives: BASIC_STEPS, elementCount: 5, maxExamples: 4 },
    structure: { elementCount: 6, arrowCount: 7, distractorMutation: 'rewire' },
    tree: { elementCount: 7, depth: 1, operations: ALL_TREE_OPS, maxExamples: 1 },
  },
  9: {
    level: 9,
    tier: 'expert',
    objective: 'Look-alike structures with identical arrow counts, and two-step tree rules.',
    challengeCount: 8,
    timing: seconds(210, 90),
    kinds: { 'transform-inference': 1.5, 'structure-match': 1, 'tree-analogy': 1 },
    abstractionLevel: 5,
    complexity: 3,
    distractors: 3,
    sequence: { families: ['alternating-ops', 'step-cycle'], sequenceLength: 7 },
    grid: { size: 4, varyingAttributes: 2, shapeRules: CATEGORICAL, countRules: ARITHMETIC },
    transform: { depth: 3, primitives: ALL_STEPS, elementCount: 5, maxExamples: 4 },
    structure: { elementCount: 6, arrowCount: 7, distractorMutation: 'degree-preserving' },
    tree: { elementCount: 6, depth: 2, operations: ALL_TREE_OPS, maxExamples: 2 },
  },
  10: {
    level: 10,
    tier: 'expert',
    objective:
      'Minimal evidence: three-step programs, seven-node look-alikes, composed tree rules.',
    challengeCount: 8,
    timing: seconds(240, 100),
    kinds: { 'transform-inference': 1.5, 'structure-match': 1, 'tree-analogy': 1 },
    abstractionLevel: 5,
    complexity: 3,
    distractors: 3,
    sequence: { families: ['alternating-ops', 'step-cycle'], sequenceLength: 7 },
    grid: { size: 4, varyingAttributes: 2, shapeRules: CATEGORICAL, countRules: ARITHMETIC },
    transform: { depth: 3, primitives: ALL_STEPS, elementCount: 5, maxExamples: 3 },
    structure: { elementCount: 7, arrowCount: 9, distractorMutation: 'degree-preserving' },
    tree: { elementCount: 7, depth: 2, operations: ALL_TREE_OPS, maxExamples: 2 },
  },
};
