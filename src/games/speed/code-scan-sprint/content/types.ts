import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/** One line of the pseudocode listing as shown (indent = nesting depth). */
export interface ScanLine {
  readonly indent: number;
  readonly text: string;
}

/**
 * What the query asks for:
 * - `call`: the only line that calls a routine (`print(total)`);
 * - `number`: the only line containing a number;
 * - `first-assign` / `last-assign`: the first / last line that gives a variable a value (`x ← …`);
 * - `condition`: the only `if` / `while` line whose condition mentions a variable that other
 *   lines also use.
 */
export type QueryKind = 'call' | 'number' | 'first-assign' | 'last-assign' | 'condition';

export interface CodeScanSprintContent {
  readonly kind: QueryKind;
  /** Routine, variable or number the query is about. */
  readonly subject: string;
  readonly lines: readonly ScanLine[];
}

export type CodeScanSprintChallenge = Challenge<'speed', CodeScanSprintContent>;

export interface CodeScanSprintProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<QueryKind, number>>>;
  /** elementCount: lines in the listing. */
  readonly lineCount: number;
  readonly variables: number;
  readonly routines: number;
  /** complexity: maximum nesting depth of `if` / `while` / `repeat` blocks (0 = flat). */
  readonly maxDepth: number;
  /** First-assign queries need a variable assigned at least this many times (decoys). */
  readonly minAssignments: number;
  /** Largest number literal. */
  readonly maxNumber: number;
}
