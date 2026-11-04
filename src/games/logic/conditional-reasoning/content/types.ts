import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/** A simple sentence (atom) or its negation. */
export interface Literal {
  readonly atom: number;
  readonly value: boolean;
}

export type Premise =
  | { readonly type: 'fact'; readonly lit: Literal }
  | { readonly type: 'if'; readonly a: Literal; readonly b: Literal }
  /** "main unless cond": if cond is not true, then main. */
  | { readonly type: 'unless'; readonly main: Literal; readonly cond: Literal }
  /** "a only if b": if a, then b. */
  | { readonly type: 'only-if'; readonly a: Literal; readonly b: Literal }
  /** "Either a or b (or both)". */
  | { readonly type: 'or'; readonly a: Literal; readonly b: Literal };

export type Verdict = 'true' | 'false' | 'unknown';

/** The four classic one-rule patterns, named for the explanation. */
export type Pattern =
  'affirm-antecedent' | 'deny-consequent' | 'affirm-consequent' | 'deny-antecedent' | 'none';

export type Structure = 'basic' | 'chain' | 'unless' | 'only-if' | 'mixed';

export interface ConditionalContent {
  readonly kind: Structure;
  /** Atom sentence ids (`lamp`, `rain`…); their wording comes from the `logic` namespace. */
  readonly atoms: readonly string[];
  readonly premises: readonly Premise[];
  readonly question: Literal;
  readonly pattern: Pattern;
}

export type ConditionalChallenge = Challenge<'logic', ConditionalContent>;

export interface ConditionalProfile extends DifficultyProfile {
  readonly structures: Readonly<Partial<Record<Structure, number>>>;
  /** Which facts a one-rule puzzle may give. */
  readonly patterns: readonly Exclude<Pattern, 'none'>[];
  /** Possible correct verdicts; the generator balances between them. */
  readonly verdicts: readonly Verdict[];
  /** Rules may contain "not" inside their parts. */
  readonly negatedParts: boolean;
  /** Rules in a chain (chain) or premises (mixed). */
  readonly chainLength: number;
  /** Atoms in a mixed puzzle. */
  readonly atoms: number;
}
