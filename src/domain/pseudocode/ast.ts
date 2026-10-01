/**
 * Language-neutral teaching pseudocode (Python-like surface, deliberately small):
 *
 *   x = 10                      if x > 5:              for item in items:     function add(a, b):
 *   name = "Ada"                    result = "A"           total = total + item   return a + b
 *   items = [1, 2, 3]           elif x > 0:            while n > 0:
 *   items[0] = 7                    result = "B"           n = n - 1          print(add(2, 3))
 *                               else:
 *                                   result = "C"
 *
 * Values are numbers, text, true/false, lists and `none`. Programs are data: they are parsed and
 * interpreted here, never handed to the JavaScript engine.
 */
export type Value = number | string | boolean | null | Value[];

export type BinaryOp =
  '+' | '-' | '*' | '/' | '%' | '==' | '!=' | '<' | '<=' | '>' | '>=' | 'and' | 'or';

export type Expr =
  | { readonly type: 'literal'; readonly value: Value }
  | { readonly type: 'name'; readonly name: string }
  | { readonly type: 'list'; readonly items: readonly Expr[] }
  | { readonly type: 'index'; readonly target: Expr; readonly index: Expr }
  | { readonly type: 'call'; readonly callee: string; readonly args: readonly Expr[] }
  | { readonly type: 'unary'; readonly op: '-' | 'not'; readonly operand: Expr }
  | { readonly type: 'binary'; readonly op: BinaryOp; readonly left: Expr; readonly right: Expr };

interface At {
  /** 1-based source line. */
  readonly line: number;
}

export type Stmt =
  | (At & { readonly type: 'assign'; readonly target: string; readonly value: Expr })
  | (At & {
      readonly type: 'assign-index';
      readonly target: string;
      readonly index: Expr;
      readonly value: Expr;
    })
  | (At & {
      readonly type: 'if';
      readonly branches: readonly { readonly cond: Expr; readonly body: readonly Stmt[] }[];
      readonly otherwise: readonly Stmt[] | null;
    })
  | (At & { readonly type: 'while'; readonly cond: Expr; readonly body: readonly Stmt[] })
  | (At & {
      readonly type: 'for';
      readonly variable: string;
      readonly iterable: Expr;
      readonly body: readonly Stmt[];
    })
  | (At & {
      readonly type: 'function';
      readonly name: string;
      readonly params: readonly string[];
      readonly body: readonly Stmt[];
    })
  | (At & { readonly type: 'return'; readonly value: Expr | null })
  | (At & { readonly type: 'print'; readonly args: readonly Expr[] })
  | (At & { readonly type: 'expr'; readonly expr: Expr });

export interface Program {
  readonly source: string;
  readonly body: readonly Stmt[];
}
