import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

// ── Code snippets (language-neutral pseudocode, stored as tokens so diffs are exact) ─────────────

/**
 * `keyword` and `punct` are structure and never mutated; `name` is a variable or array, `func` a
 * called routine, `operator` covers comparison, arithmetic and logical operators.
 */
export type TokenType = 'keyword' | 'name' | 'func' | 'number' | 'operator' | 'punct';

export interface Token {
  readonly type: TokenType;
  readonly text: string;
}

export interface CodeLine {
  /** Nesting depth, rendered as indentation. */
  readonly indent: number;
  readonly tokens: readonly Token[];
}

export type Snippet = readonly CodeLine[];

// ── Mutations ─────────────────────────────────────────────────────────────────────────────────────

/**
 * What a single-token change can be. Every category is recognisable from the two tokens alone:
 * - `operator`: one operator replaced by another (never by its logical complement when classifying);
 * - `variable`: a name replaced by another variable that already appears in the snippet;
 * - `number`: a literal replaced by a different literal;
 * - `typo`: a name misspelled into a word that appears nowhere in the snippet;
 * - `negation`: `not` inserted in front of an `if` / `while` condition.
 */
export type MutationCategory = 'operator' | 'variable' | 'number' | 'typo' | 'negation';

/** Coarse changes stand out (`+` → `*`, 3 → 9); fine ones are one-character near misses (`<` → `<=`). */
export type Subtlety = 'coarse' | 'fine';

export interface Mutation {
  readonly category: MutationCategory;
  readonly subtlety: Subtlety;
  /** 0-based line of the snippet that changes. */
  readonly line: number;
  /** Token text before and after; `before` is null for an insertion (`not`). */
  readonly before: string | null;
  readonly after: string;
  /** True when `after` is the logical complement of `before` (`=` → `≠`): ambiguous with negation. */
  readonly complement: boolean;
}

// ── Content ───────────────────────────────────────────────────────────────────────────────────────

export type CodeScanContent =
  | {
      readonly kind: 'same-or-different';
      readonly original: Snippet;
      readonly copy: Snippet;
    }
  | {
      readonly kind: 'find-the-change';
      readonly original: Snippet;
      readonly copy: Snippet;
    }
  | {
      readonly kind: 'classify-the-change';
      readonly original: Snippet;
      readonly copy: Snippet;
      /** 0-based line pointed out to the player; null when the change must be found first. */
      readonly highlightLine: number | null;
    };

export type CodeScanKind = CodeScanContent['kind'];

export type SpeedChallenge = Challenge<'speed', CodeScanContent>;

// ── Difficulty ────────────────────────────────────────────────────────────────────────────────────

export interface CodeScanProfile extends DifficultyProfile {
  /** Kinds that may appear at this level, with relative weights. */
  readonly kinds: Readonly<Partial<Record<CodeScanKind, number>>>;
  /** elementCount: lines per snippet. */
  readonly elementCount: number;
  /** complexity: maximum nesting depth of blocks (1 = flat blocks, 2 = a block inside a loop). */
  readonly complexity: 1 | 2;
  /**
   * visualNoise in [0, 1]: share of the snippet built from runs of near-identical lines, and the
   * probability that the change lands inside such a run.
   */
  readonly visualNoise: number;
  /** distractors: mutation categories that may be applied. */
  readonly distractors: readonly MutationCategory[];
  /** Probability in [0, 1] of preferring a fine (one-character) change over a coarse one. */
  readonly fineShare: number;
  /** Classify-the-change points at the changed line (true) or makes the player find it (false). */
  readonly highlightChange: boolean;
}
