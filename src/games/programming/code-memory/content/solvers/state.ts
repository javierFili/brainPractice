import type { Assignment, Expr, Operand } from '../types';

export type Environment = Readonly<Record<string, number>>;

/** A plausible memory slip, used to build wrong options that real players would pick. */
export type Slip =
  /** Forget one update (0-based line index). */
  | { readonly type: 'skip'; readonly line: number }
  /** Remember only the first value of every variable and read that instead of the current one. */
  | { readonly type: 'stale' };

export class UndefinedVariableError extends Error {
  constructor(name: string) {
    super(`Variable "${name}" is read before being assigned`);
  }
}

function read(env: Environment, operand: Operand): number {
  if (operand.type === 'num') return operand.value;
  const value = env[operand.name];
  if (value === undefined) throw new UndefinedVariableError(operand.name);
  return value;
}

export function evaluate(expr: Expr, env: Environment): number {
  if (expr.type !== 'bin') return read(env, expr);
  const left = read(env, expr.left);
  const right = read(env, expr.right);
  switch (expr.op) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
  }
}

/** Environment after each line (index i = state once line i+1 has run). */
export function trace(lines: readonly Assignment[], slip?: Slip): Environment[] {
  const snapshots: Environment[] = [];
  let env: Environment = {};
  let first: Environment = {};
  lines.forEach((line, i) => {
    if (slip?.type === 'skip' && slip.line === i) {
      snapshots.push(env);
      return;
    }
    const value = evaluate(line.expr, slip?.type === 'stale' ? { ...env, ...first } : env);
    env = { ...env, [line.target]: value };
    if (!(line.target in first)) first = { ...first, [line.target]: value };
    snapshots.push(env);
  });
  return snapshots;
}

/** Value of `variable` right after 1-based `afterLine` (null = after the last line). */
export function valueAt(
  lines: readonly Assignment[],
  variable: string,
  afterLine: number | null,
  slip?: Slip,
): number | undefined {
  const snapshots = trace(lines, slip);
  return snapshots[(afterLine ?? lines.length) - 1]?.[variable];
}
