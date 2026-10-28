import {
  literal,
  parseProgram,
  runProgram,
  type Program,
  type RunResult,
  type Value,
  type Variables,
} from '@/domain/pseudocode';

/**
 * Generated programs only ever run through the in-house interpreter. Searches (every input, every
 * block order) run without a trace and with a tight step budget, so a runaway candidate is cut
 * off quickly and simply rejected.
 */
export const SEARCH_LIMITS = { maxSteps: 1500, maxTrace: 0 } as const;

export function compile(source: string): Program | null {
  const parsed = parseProgram(source);
  return parsed.ok ? parsed.value : null;
}

/** Runs without a trace; for searches over many candidates. */
export const runQuick = (program: Program, inputs: Variables = {}): RunResult =>
  runProgram(program, { inputs, limits: SEARCH_LIMITS });

/** Runs with the full trace (for answers, explanations and the review table). */
export const runTraced = (program: Program, inputs: Variables = {}): RunResult =>
  runProgram(program, { inputs, limits: { maxSteps: 3000, maxTrace: 600 } });

/** Parses and runs a known-good generated source; null when it does not parse or fails. */
export function runSource(source: string): RunResult | null {
  const program = compile(source);
  if (program === null) return null;
  const result = runTraced(program);
  return result.error === null ? result : null;
}

export const isInteger = (value: Value | undefined): value is number =>
  typeof value === 'number' && Number.isInteger(value);

/** Indents each line of a block by `depth` levels (4 spaces each). */
export const indent = (lines: readonly string[], depth = 1): string[] =>
  lines.map((line) => `${' '.repeat(4 * depth)}${line}`);

/** "x = 4, y = 7" for a set of variables (text values keep their quotes). */
export const describeVariables = (variables: Variables): string =>
  Object.entries(variables)
    .map(([name, value]) => `${name} = ${literal(value)}`)
    .join(', ');
