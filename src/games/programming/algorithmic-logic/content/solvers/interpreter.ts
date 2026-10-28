import type { Cond, Expr, Stmt } from '../types';

export type Environment = Readonly<Record<string, number>>;

export interface Mutation {
  /** Evaluates the n-th `if` (in execution order) the wrong way, as a careless reader might. */
  readonly flipIf?: number;
  /** Runs every `repeat` this many extra (or fewer) times: the classic off-by-one. */
  readonly loopDelta?: number;
  /** Stops before the last top-level statement. */
  readonly dropLast?: boolean;
}

export class ExecutionLimitError extends Error {}

const MAX_STEPS = 500;

export function evaluateExpr(expr: Expr, env: Environment): number {
  switch (expr.type) {
    case 'num':
      return expr.value;
    case 'var': {
      const value = env[expr.name];
      if (value === undefined) throw new ReferenceError(`Variable ${expr.name} is not defined`);
      return value;
    }
    case 'bin': {
      const left = evaluateExpr(expr.left, env);
      const right = evaluateExpr(expr.right, env);
      if (expr.op === '+') return left + right;
      if (expr.op === '-') return left - right;
      return left * right;
    }
  }
}

export function evaluateCond(cond: Cond, env: Environment): boolean {
  switch (cond.type) {
    case 'cmp': {
      const l = evaluateExpr(cond.left, env);
      const r = evaluateExpr(cond.right, env);
      const results = {
        '<': l < r,
        '<=': l <= r,
        '>': l > r,
        '>=': l >= r,
        '=': l === r,
        '≠': l !== r,
      };
      return results[cond.op];
    }
    case 'and':
      return evaluateCond(cond.left, env) && evaluateCond(cond.right, env);
    case 'or':
      return evaluateCond(cond.left, env) || evaluateCond(cond.right, env);
    case 'not':
      return !evaluateCond(cond.operand, env);
  }
}

export interface Execution {
  readonly env: Readonly<Record<string, number>>;
  /** How many `if` statements were evaluated; each one is a possible `flipIf` target. */
  readonly ifsEvaluated: number;
}

/**
 * Executes a program. `mutation` simulates typical tracing mistakes; the resulting values feed
 * plausible distractors. Throws ExecutionLimitError on runaway loops.
 */
export function execute(program: readonly Stmt[], mutation: Mutation = {}): Execution {
  const env: Record<string, number> = {};
  let steps = 0;
  let ifsEvaluated = 0;

  const tick = () => {
    steps += 1;
    if (steps > MAX_STEPS) throw new ExecutionLimitError('Program exceeded the step limit');
  };

  const exec = (statements: readonly Stmt[]): void => {
    for (const stmt of statements) {
      tick();
      switch (stmt.type) {
        case 'assign':
          env[stmt.target] = evaluateExpr(stmt.expr, env);
          break;
        case 'swap': {
          const a = evaluateExpr({ type: 'var', name: stmt.a }, env);
          env[stmt.a] = evaluateExpr({ type: 'var', name: stmt.b }, env);
          env[stmt.b] = a;
          break;
        }
        case 'if': {
          const flipped = mutation.flipIf === ifsEvaluated;
          ifsEvaluated += 1;
          exec(evaluateCond(stmt.cond, env) !== flipped ? stmt.then : stmt.otherwise);
          break;
        }
        case 'repeat':
          for (let i = 0; i < Math.max(0, stmt.times + (mutation.loopDelta ?? 0)); i++)
            exec(stmt.body);
          break;
        case 'while':
          while (evaluateCond(stmt.cond, env)) {
            tick();
            exec(stmt.body);
          }
          break;
      }
    }
  };

  exec(mutation.dropLast ? program.slice(0, -1) : program);
  return { env, ifsEvaluated };
}
