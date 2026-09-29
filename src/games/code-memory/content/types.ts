import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

// ── Records (language-neutral: `Order { id: 482, status: PAID }`) ────────────────────────────────

export interface Field {
  readonly name: string;
  /** Display text; values are compared as text, so `482` and `PAID` are handled alike. */
  readonly value: string;
}

export interface DataRecord {
  /** Entity type shown before the braces, e.g. `User`. */
  readonly type: string;
  readonly fields: readonly Field[];
}

// ── Assignments (straight-line state updates) ─────────────────────────────────────────────────────

export type ArithmeticOp = '+' | '-' | '*';

export type Operand =
  | { readonly type: 'num'; readonly value: number }
  | { readonly type: 'var'; readonly name: string };

export type Expr =
  | Operand
  | {
      readonly type: 'bin';
      readonly op: ArithmeticOp;
      readonly left: Operand;
      readonly right: Operand;
    };

export interface Assignment {
  readonly target: string;
  readonly expr: Expr;
}

// ── Content ───────────────────────────────────────────────────────────────────────────────────────

export type SequenceAsk =
  /** "Which call was #index+1?" */
  | { readonly type: 'position'; readonly index: number }
  /** "Which call came right after calls[index]?" */
  | { readonly type: 'successor'; readonly index: number }
  /** Rebuild the whole order. */
  | { readonly type: 'order' };

export type MemoryContent =
  | {
      readonly kind: 'record-recall';
      /** Every record has a different type, so "the Order record" names exactly one. */
      readonly records: readonly DataRecord[];
      readonly ask: { readonly recordIndex: number; readonly field: string };
    }
  | {
      readonly kind: 'cross-reference';
      /** Records of one type; the key and target columns hold distinct values. */
      readonly records: readonly DataRecord[];
      readonly ask: {
        readonly keyField: string;
        readonly keyValue: string;
        readonly targetField: string;
        readonly recordIndex: number;
      };
    }
  | {
      readonly kind: 'foreign-key-join';
      readonly parents: readonly DataRecord[];
      /** Each child points at a distinct parent through `foreignKey`. */
      readonly children: readonly DataRecord[];
      readonly foreignKey: string;
      readonly ask: {
        readonly keyField: string;
        readonly keyValue: string;
        readonly targetField: string;
        readonly parentIndex: number;
        readonly childIndex: number;
      };
    }
  | {
      readonly kind: 'sequence-recall';
      /** Distinct calls such as `GET /users`, in the order they ran. */
      readonly calls: readonly string[];
      readonly ask: SequenceAsk;
    }
  | {
      readonly kind: 'variable-state';
      readonly lines: readonly Assignment[];
      readonly ask: {
        readonly variable: string;
        /** 1-based line after which the value is asked; null = at the end. */
        readonly afterLine: number | null;
      };
    }
  | {
      readonly kind: 'position-recall';
      readonly rows: number;
      readonly cols: number;
      /** Row-major; null = empty cell. Every keyword appears at most once. */
      readonly cells: readonly (string | null)[];
      readonly target: string;
    };

export type MemoryKind = MemoryContent['kind'];

export type ContentOf<K extends MemoryKind> = Extract<MemoryContent, { kind: K }>;

export type MemoryChallenge = Challenge<'memory', MemoryContent>;

// ── Difficulty ────────────────────────────────────────────────────────────────────────────────────

export type SequenceQuestion = SequenceAsk['type'];

export interface CodeMemoryProfile extends DifficultyProfile {
  /** Kinds that may appear at this level, with relative weights. */
  readonly kinds: Readonly<Partial<Record<MemoryKind, number>>>;
  /** Wrong options on single-choice questions. */
  readonly distractors: number;
  /**
   * Study time = load units × kind weight × perItemMs, clamped to [minMs, timing.studyMs].
   * `timing.studyMs` is therefore the longest study phase of the level.
   */
  readonly study: { readonly perItemMs: number; readonly minMs: number };
  readonly records: {
    /** memoryLoad */
    readonly recordCount: number;
    /** elementCount per record, `id` included */
    readonly fieldCount: number;
    /** Interference: ids are digit permutations of each other and names look alike. */
    readonly similarity: 'low' | 'high';
  };
  readonly sequence: {
    readonly sequenceLength: number;
    readonly questions: readonly SequenceQuestion[];
    /** visualNoise: calls share resources and differ only by method or path depth. */
    readonly similarCalls: boolean;
  };
  readonly state: {
    /** memoryLoad */
    readonly variableCount: number;
    /** sequenceLength */
    readonly lineCount: number;
    /** complexity */
    readonly ops: readonly ArithmeticOp[];
    /** Asking the value at an intermediate line requires remembering when, not only what. */
    readonly question: 'final' | 'mixed';
    readonly answer: 'choice' | 'numeric';
  };
  readonly grid: {
    readonly rows: number;
    readonly cols: number;
    /** elementCount: filled cells */
    readonly elementCount: number;
    /** visualNoise: keywords come from few look-alike families (`map`, `max`, `min`…). */
    readonly similarKeywords: boolean;
  };
  /** Two linked tables; null at levels without joins. */
  readonly join: { readonly parentCount: number; readonly childCount: number } | null;
}
