import { runProgram, type Expr, type Stmt, type Variables } from '@/domain/pseudocode';

/**
 * Step budget for a whole candidate program. Intended programs stay well below it (checked by the
 * generator); a wrong order that loops forever (e.g. doubling a zero) is cut off quickly.
 */
export const BLOCK_STEP_LIMIT = 200;

/** A block compiled on its own; blocks are chained as statement lists, never re-parsed. */
export interface CompiledBlock {
  readonly id: string;
  readonly body: readonly Stmt[];
  /** See `certainReads`; computed once per block. */
  readonly reads?: ReadonlySet<string> | null;
}

/**
 * Names a single assignment or print is certain to evaluate, or null when that cannot be known
 * without running it (loops, ifs, `and` / `or`, which may skip parts). Used only to skip runs that
 * are guaranteed to fail with "used before being set": the outcome is the same as running them.
 */
export function certainReads(body: readonly Stmt[]): ReadonlySet<string> | null {
  if (body.length !== 1) return null;
  const stmt = body[0] as Stmt;
  const names = new Set<string>();
  const visit = (expr: Expr): boolean => {
    switch (expr.type) {
      case 'literal':
        return true;
      case 'name':
        names.add(expr.name);
        return true;
      case 'list':
        return expr.items.every(visit);
      case 'index':
        return visit(expr.target) && visit(expr.index);
      case 'call':
        return expr.args.every(visit);
      case 'unary':
        return visit(expr.operand);
      case 'binary':
        return expr.op !== 'and' && expr.op !== 'or' && visit(expr.left) && visit(expr.right);
    }
  };
  if (stmt.type === 'assign') return visit(stmt.value) ? names : null;
  if (stmt.type === 'print') return stmt.args.every(visit) ? names : null;
  // A while condition is always evaluated at least once.
  if (stmt.type === 'while') return visit(stmt.cond) ? names : null;
  if (stmt.type === 'for') {
    // `for v in range(a, b)` with literal bounds and a ≤ b − 1: the body certainly runs once.
    const it = stmt.iterable;
    if (it.type !== 'call' || it.callee !== 'range') return null;
    const bounds = it.args.map((a) =>
      a.type === 'literal' && typeof a.value === 'number' ? a.value : null,
    );
    if (bounds.some((b) => b === null) || bounds.length === 0 || bounds.length > 2) return null;
    const [from, to] =
      bounds.length === 1 ? [0, bounds[0] as number] : (bounds as [number, number]);
    if (to <= from) return null;
    const inner = certainReads(stmt.body.slice(0, 1));
    if (inner === null) return names;
    for (const name of inner) if (name !== stmt.variable) names.add(name);
    return names;
  }
  return null;
}

export interface State {
  readonly variables: Variables;
  readonly output: readonly string[];
  readonly steps: number;
}

const isPrefix = (output: readonly string[], target: readonly string[]) =>
  output.length <= target.length && output.every((line, i) => line === target[i]);

/**
 * Every sequence of `length` distinct blocks whose program prints exactly `target`, found by
 * running candidates through the interpreter. Blocks only share top-level variables and output
 * (no functions), so running a prefix and then the next block from the prefix's variables is
 * exactly the same as running the concatenated program; each prefix therefore runs once. A
 * prefix that fails, or prints something the target does not start with, rules out all its
 * extensions (output only grows), so the search is exhaustive. Stops after `cap` solutions.
 */
export function solutions(
  blocks: readonly CompiledBlock[],
  target: readonly string[],
  length: number,
  cap = 2,
): string[][] {
  const found: string[][] = [];
  const chosen: string[] = [];
  const visit = (state: State) => {
    if (found.length >= cap) return;
    if (chosen.length === length) {
      if (state.output.length === target.length) found.push([...chosen]);
      return;
    }
    for (const block of blocks) {
      if (chosen.includes(block.id)) continue;
      const reads = block.reads ?? null;
      if (reads !== null && [...reads].some((name) => !Object.hasOwn(state.variables, name)))
        continue;
      const run = runProgram(
        { source: '', body: block.body },
        {
          inputs: state.variables,
          limits: { maxSteps: BLOCK_STEP_LIMIT - state.steps, maxTrace: 0 },
        },
      );
      if (run.error !== null) continue;
      const output = [...state.output, ...run.output];
      if (!isPrefix(output, target)) continue;
      chosen.push(block.id);
      visit({ variables: run.variables, output, steps: state.steps + run.steps });
      chosen.pop();
    }
  };
  visit({ variables: {}, output: [], steps: 0 });
  return found;
}

/** Runs blocks one after another the same way the search does; null on any error. */
export function runChain(blocks: readonly CompiledBlock[]): State | null {
  let state: State = { variables: {}, output: [], steps: 0 };
  for (const block of blocks) {
    const run = runProgram(
      { source: '', body: block.body },
      {
        inputs: state.variables,
        limits: { maxSteps: BLOCK_STEP_LIMIT - state.steps, maxTrace: 0 },
      },
    );
    if (run.error !== null) return null;
    state = {
      variables: run.variables,
      output: [...state.output, ...run.output],
      steps: state.steps + run.steps,
    };
  }
  return state;
}

/** n! / (n − k)!: how many ordered sequences the search covers. */
export const arrangements = (n: number, k: number) => {
  let total = 1;
  for (let i = 0; i < k; i++) total *= n - i;
  return total;
};
