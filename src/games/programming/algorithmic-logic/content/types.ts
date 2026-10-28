import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

// ── Pseudocode (language-neutral, structured so it can be interpreted and rendered) ──────────────

export type ArithmeticOp = '+' | '-' | '*';
export type ComparisonOp = '<' | '<=' | '>' | '>=' | '=' | '≠';

export type Expr =
  | { readonly type: 'num'; readonly value: number }
  | { readonly type: 'var'; readonly name: string }
  | { readonly type: 'bin'; readonly op: ArithmeticOp; readonly left: Expr; readonly right: Expr };

export type Cond =
  | { readonly type: 'cmp'; readonly op: ComparisonOp; readonly left: Expr; readonly right: Expr }
  | { readonly type: 'and' | 'or'; readonly left: Cond; readonly right: Cond }
  | { readonly type: 'not'; readonly operand: Cond };

export type Stmt =
  | { readonly type: 'assign'; readonly target: string; readonly expr: Expr }
  | { readonly type: 'swap'; readonly a: string; readonly b: string }
  | {
      readonly type: 'if';
      readonly cond: Cond;
      readonly then: readonly Stmt[];
      readonly otherwise: readonly Stmt[];
    }
  | { readonly type: 'repeat'; readonly times: number; readonly body: readonly Stmt[] }
  | { readonly type: 'while'; readonly cond: Cond; readonly body: readonly Stmt[] };

// ── Graphs ────────────────────────────────────────────────────────────────────────────────────────

/** `[from, to]`: `from` must finish before `to` starts. */
export type Edge = readonly [string, string];

export interface TaskGraph {
  readonly nodes: readonly string[];
  readonly edges: readonly Edge[];
  /** Rounds each task takes; absent means every task takes 1 round. */
  readonly durations?: Readonly<Record<string, number>>;
}

// ── Constraints ───────────────────────────────────────────────────────────────────────────────────

export type ConstraintRule =
  | { readonly type: 'before'; readonly a: string; readonly b: string }
  | { readonly type: 'immediately-before'; readonly a: string; readonly b: string }
  | { readonly type: 'not-adjacent'; readonly a: string; readonly b: string }
  | { readonly type: 'at'; readonly a: string; readonly position: number }
  | { readonly type: 'not-at'; readonly a: string; readonly position: number };

export type ConstraintRuleType = ConstraintRule['type'];

// ── Content ───────────────────────────────────────────────────────────────────────────────────────

export type LogicContent =
  | { readonly kind: 'dependency-order'; readonly graph: TaskGraph }
  | { readonly kind: 'dependency-count'; readonly graph: TaskGraph; readonly target: string }
  | { readonly kind: 'critical-path'; readonly graph: TaskGraph }
  | { readonly kind: 'program-trace'; readonly program: readonly Stmt[]; readonly ask: string }
  | {
      readonly kind: 'constraint-arrangement';
      readonly entities: readonly string[];
      readonly rules: readonly ConstraintRule[];
      /** 1-based slot asked about; null when the whole arrangement is asked. */
      readonly askPosition: number | null;
    };

export type LogicKind = LogicContent['kind'];

export type LogicChallenge = Challenge<'logic', LogicContent>;

// ── Difficulty ────────────────────────────────────────────────────────────────────────────────────

export type ProgramBlock =
  'assign' | 'if' | 'if-bool' | 'repeat' | 'repeat-if' | 'while' | 'swap' | 'nested-repeat';

export interface LogicProfile extends DifficultyProfile {
  /** Kinds that may appear at this level, with relative weights. */
  readonly kinds: Readonly<Partial<Record<LogicKind, number>>>;
  readonly graph: {
    /** numberOfElements */
    readonly nodeCount: number;
    /** dependencyCount */
    readonly dependencyCount: number;
    /** Wrong orders break several dependencies (obvious) or exactly one (subtle near-miss). */
    readonly violation: 'obvious' | 'subtle';
    /** Critical path with per-task durations. */
    readonly weighted: boolean;
  };
  readonly program: {
    /** memoryLoad */
    readonly variableCount: number;
    /** complexity: number of blocks after initialisation */
    readonly blockCount: number;
    readonly blocks: readonly ProgramBlock[];
    readonly answer: 'choice' | 'numeric';
  };
  readonly constraints: {
    readonly entityCount: number;
    readonly ruleTypes: readonly ConstraintRuleType[];
    /** decisionCount: arrangement verification (easier) vs. deducing a single position. */
    readonly question: 'arrangement' | 'position';
  };
}
