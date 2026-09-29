import type { Cond, Expr, Stmt } from '../content/types';

const PRECEDENCE = { '+': 1, '-': 1, '*': 2 } as const;

export function formatExpr(expr: Expr, parent = 0): string {
  if (expr.type === 'num') return String(expr.value);
  if (expr.type === 'var') return expr.name;
  const own = PRECEDENCE[expr.op];
  const text = `${formatExpr(expr.left, own)} ${expr.op} ${formatExpr(expr.right, own + 1)}`;
  return own < parent ? `(${text})` : text;
}

export function formatCond(cond: Cond): string {
  switch (cond.type) {
    case 'cmp':
      return `${formatExpr(cond.left)} ${cond.op} ${formatExpr(cond.right)}`;
    case 'and':
    case 'or': {
      const side = (c: Cond) =>
        c.type === 'cmp' || c.type === 'not' ? formatCond(c) : `(${formatCond(c)})`;
      return `${side(cond.left)} ${cond.type} ${side(cond.right)}`;
    }
    case 'not':
      return `not (${formatCond(cond.operand)})`;
  }
}

export interface Line {
  readonly depth: number;
  readonly keyword: string;
  readonly text: string;
}

export function toLines(program: readonly Stmt[], depth = 0): Line[] {
  return program.flatMap((stmt): Line[] => {
    switch (stmt.type) {
      case 'assign':
        return [{ depth, keyword: 'set', text: `${stmt.target} ← ${formatExpr(stmt.expr)}` }];
      case 'swap':
        return [{ depth, keyword: 'swap', text: `${stmt.a}, ${stmt.b}` }];
      case 'if':
        return [
          { depth, keyword: 'if', text: `${formatCond(stmt.cond)}:` },
          ...toLines(stmt.then, depth + 1),
          ...(stmt.otherwise.length > 0
            ? [{ depth, keyword: 'else', text: ':' }, ...toLines(stmt.otherwise, depth + 1)]
            : []),
        ];
      case 'repeat':
        return [
          { depth, keyword: 'repeat', text: `${stmt.times} times:` },
          ...toLines(stmt.body, depth + 1),
        ];
      case 'while':
        return [
          { depth, keyword: 'while', text: `${formatCond(stmt.cond)}:` },
          ...toLines(stmt.body, depth + 1),
        ];
    }
  });
}
