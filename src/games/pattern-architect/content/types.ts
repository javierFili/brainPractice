import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

// ── Number sequences ──────────────────────────────────────────────────────────────────────────────

/**
 * Rule families a sequence can follow. Each is a recurrence: the shown terms fix its parameters,
 * so the solver can fit every family independently and check whether it explains the sequence.
 */
export type SequenceRule =
  | { readonly family: 'constant-step'; readonly step: number }
  | { readonly family: 'alternating-steps'; readonly steps: readonly [number, number] }
  | { readonly family: 'growing-step'; readonly firstStep: number; readonly growth: number }
  | { readonly family: 'multiply'; readonly factor: number }
  /** Two independent sequences on even and odd positions, each with its own constant step. */
  | { readonly family: 'interleaved'; readonly steps: readonly [number, number] }
  | { readonly family: 'step-cycle'; readonly steps: readonly [number, number, number] }
  | { readonly family: 'multiply-add'; readonly factor: number; readonly add: number }
  | { readonly family: 'sum-of-previous-two' }
  /** Alternately multiply by `factor` and add `add`, starting with the multiplication or not. */
  | {
      readonly family: 'alternating-ops';
      readonly factor: number;
      readonly add: number;
      readonly multiplyFirst: boolean;
    };

export type SequenceFamily = SequenceRule['family'];

// ── Symbol grids ──────────────────────────────────────────────────────────────────────────────────

export const SHAPES = ['circle', 'triangle', 'square', 'diamond', 'star'] as const;
export type Shape = (typeof SHAPES)[number];

export interface GridCell {
  readonly shape: Shape;
  readonly count: number;
}

export type GridAttribute = 'shape' | 'count';

/**
 * How one attribute of the cells is laid out. Categorical rules work for both attributes; the
 * arithmetic ones (progressions and sums) only for counts.
 */
export type GridRule =
  | 'constant'
  | 'by-row'
  | 'by-column'
  /** Each row is the previous row moved one place to the left (wrapping around). */
  | 'shift-left'
  | 'shift-right'
  | 'row-step'
  | 'column-step'
  | 'row-sum'
  | 'column-sum';

// ── Transform inference (hidden list programs) ────────────────────────────────────────────────────

export type ListOp =
  | { readonly op: 'reverse' }
  | { readonly op: 'sort-ascending' }
  | { readonly op: 'sort-descending' }
  | { readonly op: 'rotate-left' }
  | { readonly op: 'rotate-right' }
  | { readonly op: 'drop-first' }
  | { readonly op: 'drop-last' }
  | { readonly op: 'duplicate-each' }
  | { readonly op: 'add'; readonly amount: number }
  | { readonly op: 'double' }
  | { readonly op: 'keep-even' }
  | { readonly op: 'keep-odd' }
  | { readonly op: 'take-first'; readonly count: number }
  | { readonly op: 'swap-pairs' }
  | { readonly op: 'remove-repeats' }
  | { readonly op: 'running-total' };

export type ListOpName = ListOp['op'];

export interface ListExample {
  readonly input: readonly number[];
  readonly output: readonly number[];
}

// ── Structures (graphs and trees) ─────────────────────────────────────────────────────────────────

/** `[from, to]`: an arrow from `from` to `to` (e.g. "from uses to"). */
export type Arrow = readonly [string, string];

export interface Digraph {
  readonly nodes: readonly string[];
  readonly edges: readonly Arrow[];
}

export interface NamedGraph {
  readonly name: string;
  readonly graph: Digraph;
}

/** Ordered tree: the order of `children` matters (like items in a folder listing). */
export interface TreeNode {
  readonly label: string;
  readonly children: readonly TreeNode[];
}

export type TreeOp =
  'mirror' | 'mirror-top' | 'rotate-top' | 'prune-leaves' | 'flatten' | 'sort-children';

export interface TreeExample {
  readonly before: TreeNode;
  readonly after: TreeNode;
}

// ── Content ───────────────────────────────────────────────────────────────────────────────────────

export type PatternContent =
  | { readonly kind: 'number-sequence'; readonly terms: readonly number[] }
  | {
      readonly kind: 'symbol-grid';
      /** Row-major; exactly one cell is `null` (the missing one). */
      readonly cells: readonly (readonly (GridCell | null)[])[];
    }
  | {
      readonly kind: 'transform-inference';
      readonly examples: readonly ListExample[];
      readonly question: readonly number[];
      /** The hidden program chains at most this many steps from the shown vocabulary. */
      readonly maxSteps: number;
    }
  | {
      readonly kind: 'structure-match';
      readonly reference: Digraph;
      readonly candidates: readonly NamedGraph[];
    }
  | {
      readonly kind: 'tree-analogy';
      readonly examples: readonly TreeExample[];
      readonly question: TreeNode;
      readonly maxSteps: number;
    };

export type PatternKind = PatternContent['kind'];

export type PatternChallenge = Challenge<'patterns', PatternContent>;

// ── Difficulty ────────────────────────────────────────────────────────────────────────────────────

export interface PatternProfile extends DifficultyProfile {
  /** Kinds that may appear at this level, with relative weights. */
  readonly kinds: Readonly<Partial<Record<PatternKind, number>>>;
  /** abstractionLevel 1–5: how far the rule is from what is literally visible. */
  readonly abstractionLevel: number;
  /** complexity: most rules composed in one challenge (grid attributes or program steps). */
  readonly complexity: number;
  /** distractors: wrong options per question. */
  readonly distractors: number;
  readonly sequence: {
    readonly families: readonly SequenceFamily[];
    readonly sequenceLength: number;
  };
  readonly grid: {
    readonly size: 3 | 4;
    /** How many attributes change across the grid (the other one stays constant). */
    readonly varyingAttributes: 1 | 2;
    readonly shapeRules: readonly GridRule[];
    readonly countRules: readonly GridRule[];
  };
  readonly transform: {
    /** Composition depth of the hidden program. */
    readonly depth: number;
    readonly primitives: readonly ListOpName[];
    /** elementCount: items in each input list. */
    readonly elementCount: number;
    /** Examples are added one by one until the answer is determined, up to this cap. */
    readonly maxExamples: number;
  };
  readonly structure: {
    /** elementCount: nodes per graph. */
    readonly elementCount: number;
    readonly arrowCount: number;
    /** `rewire` moves one arrow; `degree-preserving` keeps every node's arrow counts intact. */
    readonly distractorMutation: 'rewire' | 'degree-preserving';
  };
  readonly tree: {
    readonly elementCount: number;
    readonly depth: number;
    readonly operations: readonly TreeOp[];
    readonly maxExamples: number;
  };
}
