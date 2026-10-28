import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/**
 * `verify`: a complete equation is shown ("7 + 5 = 13") — is it true?
 * `solve`: the result is missing ("7 + 5 = ?") — type it.
 */
export type ArithmeticKind = 'verify' | 'solve';

/**
 * Operation families, easiest first. Every family yields whole, non-negative results.
 * - `add-small`: one-digit addition · `add-sub-20`: addition/subtraction within 20
 * - `times-table`: 2–9 multiplication · `division`: exact division from the tables
 * - `add-sub-2d`: two-digit addition/subtraction · `times-2d`: two-digit × one-digit
 * - `precedence`: three operands, × before + / − · `brackets`: three operands with brackets
 */
export type OperationFamily =
  | 'add-small'
  | 'add-sub-20'
  | 'times-table'
  | 'division'
  | 'add-sub-2d'
  | 'times-2d'
  | 'precedence'
  | 'brackets';

export const FAMILY_ORDER: readonly OperationFamily[] = [
  'add-small',
  'add-sub-20',
  'times-table',
  'division',
  'add-sub-2d',
  'times-2d',
  'precedence',
  'brackets',
];

export interface ArithmeticContent {
  readonly kind: ArithmeticKind;
  readonly family: OperationFamily;
  /** Left-hand side with typographic operators, e.g. "3 + 4 × 2". */
  readonly expression: string;
  /** Exact value of the expression. */
  readonly value: number;
  /** Result shown on the right-hand side of a `verify` equation; null for `solve`. */
  readonly shown: number | null;
}

export type ArithmeticChallenge = Challenge<'speed', ArithmeticContent>;

export interface ArithmeticProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<ArithmeticKind, number>>>;
  readonly families: readonly OperationFamily[];
}
