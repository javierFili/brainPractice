import type { Expr, Program, Stmt, Value } from './ast';

export interface RunLimits {
  /** Statements executed before giving up (runaway loops). */
  readonly maxSteps: number;
  readonly maxDepth: number;
  /** Trace entries kept (the program keeps running after the cap). */
  readonly maxTrace: number;
}

export const DEFAULT_LIMITS: RunLimits = { maxSteps: 5000, maxDepth: 40, maxTrace: 400 };

export type Variables = Readonly<Record<string, Value>>;

export interface TraceStep {
  readonly line: number;
  /** Variables of the running scope right after the line ran. */
  readonly variables: Variables;
  /** Name of the function being run, or null at the top level. */
  readonly scope: string | null;
}

export interface RunError {
  readonly line: number;
  readonly message: string;
  readonly kind: 'name' | 'type' | 'index' | 'limit' | 'value';
}

export interface RunResult {
  /** Top-level variables when the program stopped (functions excluded). */
  readonly variables: Variables;
  readonly output: readonly string[];
  readonly trace: readonly TraceStep[];
  readonly steps: number;
  readonly error: RunError | null;
}

class Failure extends Error {
  constructor(
    readonly line: number,
    readonly kind: RunError['kind'],
    message: string,
  ) {
    super(message);
  }
}

/** Unwinds a function body on `return` (an Error subclass so it is a proper throwable). */
class Return extends Error {
  constructor(readonly value: Value) {
    super('return');
  }
}

/** Characters as UTF-16 units, consistent with `len()` and indexing. */
const charsOf = (text: string): string[] =>
  Array.from({ length: text.length }, (_, i) => text.charAt(i));

interface FunctionDef {
  readonly params: readonly string[];
  readonly body: readonly Stmt[];
}

/** How a value reads in output: text without quotes, lists with quoted text. */
export function display(value: Value): string {
  if (typeof value === 'string') return value;
  return literal(value);
}

/** How a value reads in code and variable tables: text with quotes. */
export function literal(value: Value): string {
  if (value === null) return 'none';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number')
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
  return `[${value.map(literal).join(', ')}]`;
}

const typeName = (value: Value) =>
  value === null
    ? 'none'
    : Array.isArray(value)
      ? 'list'
      : typeof value === 'string'
        ? 'text'
        : typeof value === 'boolean'
          ? 'true/false'
          : 'number';

export function valuesEqual(a: Value, b: Value): boolean {
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((item, i) => valuesEqual(item, b[i] as Value));
  return a === b;
}

const copy = (value: Value): Value => (Array.isArray(value) ? value.map(copy) : value);
const snapshot = (scope: Map<string, Value>): Variables =>
  Object.fromEntries([...scope].map(([name, value]) => [name, copy(value)]));

/**
 * Runs a parsed program. Errors become a `RunError` on the result (the output and trace up to the
 * failing line are kept), because finding them is part of what lessons teach.
 */
export function runProgram(
  program: Program,
  options: { readonly inputs?: Variables; readonly limits?: Partial<RunLimits> } = {},
): RunResult {
  const limits = { ...DEFAULT_LIMITS, ...options.limits };
  const globals = new Map<string, Value>(
    Object.entries(options.inputs ?? {}).map(([k, v]) => [k, copy(v)]),
  );
  const functions = new Map<string, FunctionDef>();
  const output: string[] = [];
  const trace: TraceStep[] = [];
  let steps = 0;
  let depth = 0;

  const fail = (line: number, kind: RunError['kind'], message: string): never => {
    throw new Failure(line, kind, message);
  };

  const lookup = (name: string, scope: Map<string, Value>, line: number): Value => {
    if (scope.has(name)) return scope.get(name) as Value;
    if (globals.has(name)) return globals.get(name) as Value;
    if (functions.has(name))
      return fail(line, 'type', `"${name}" is a function: call it with ${name}(…)`);
    return fail(line, 'name', `"${name}" has no value yet — it is used before being set`);
  };

  const number = (value: Value, line: number, what: string): number =>
    typeof value === 'number'
      ? value
      : fail(line, 'type', `${what} needs a number, got ${typeName(value)} ${literal(value)}`);

  const truthy = (value: Value, line: number): boolean =>
    typeof value === 'boolean'
      ? value
      : fail(
          line,
          'type',
          `A condition must be true or false, got ${typeName(value)} ${literal(value)}`,
        );

  const indexOf = (list: Value, index: Value, line: number): { list: Value[]; at: number } => {
    if (!Array.isArray(list) && typeof list !== 'string')
      return fail(line, 'type', `Only lists and text can be indexed, got ${typeName(list)}`);
    const at = number(index, line, 'An index');
    if (!Number.isInteger(at)) return fail(line, 'index', `Index ${at} is not a whole number`);
    if (at < 0 || at >= list.length)
      return fail(
        line,
        'index',
        `Index ${at} is outside the ${Array.isArray(list) ? 'list' : 'text'} (valid: 0 to ${list.length - 1})`,
      );
    return { list: Array.isArray(list) ? list : charsOf(list), at };
  };

  const builtins: Readonly<Record<string, (args: Value[], line: number) => Value>> = {
    len: ([value], line) =>
      Array.isArray(value) || typeof value === 'string'
        ? value.length
        : fail(line, 'type', `len() needs a list or text, got ${typeName(value ?? null)}`),
    range: (args, line) => {
      const [a, b] = args.map((v) => number(v, line, 'range()'));
      const [from, to] = b === undefined ? [0, a ?? 0] : [a ?? 0, b];
      if (to - from > 1000) return fail(line, 'limit', 'range() is too large');
      return Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);
    },
    append: ([list, item], line) => {
      if (!Array.isArray(list)) return fail(line, 'type', 'append() needs a list first');
      list.push(copy(item ?? null));
      return null;
    },
    str: ([value]) => display(value ?? null),
    abs: ([value], line) => Math.abs(number(value ?? null, line, 'abs()')),
    max: (args, line) => {
      const values = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      if (values.length === 0) return fail(line, 'value', 'max() needs at least one value');
      return Math.max(...values.map((v) => number(v, line, 'max()')));
    },
    min: (args, line) => {
      const values = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      if (values.length === 0) return fail(line, 'value', 'min() needs at least one value');
      return Math.min(...values.map((v) => number(v, line, 'min()')));
    },
  };

  function evaluate(expr: Expr, scope: Map<string, Value>, line: number): Value {
    switch (expr.type) {
      case 'literal':
        return copy(expr.value);
      case 'name':
        return lookup(expr.name, scope, line);
      case 'list':
        return expr.items.map((item) => evaluate(item, scope, line));
      case 'index': {
        const target = evaluate(expr.target, scope, line);
        const { list, at } = indexOf(target, evaluate(expr.index, scope, line), line);
        return list[at] as Value;
      }
      case 'unary': {
        const value = evaluate(expr.operand, scope, line);
        return expr.op === '-' ? -number(value, line, 'Negation') : !truthy(value, line);
      }
      case 'binary':
        return binary(expr, scope, line);
      case 'call':
        return call(
          expr.callee,
          expr.args.map((arg) => evaluate(arg, scope, line)),
          line,
        );
    }
  }

  function binary(
    expr: Extract<Expr, { type: 'binary' }>,
    scope: Map<string, Value>,
    line: number,
  ): Value {
    if (expr.op === 'and')
      return (
        truthy(evaluate(expr.left, scope, line), line) &&
        truthy(evaluate(expr.right, scope, line), line)
      );
    if (expr.op === 'or')
      return (
        truthy(evaluate(expr.left, scope, line), line) ||
        truthy(evaluate(expr.right, scope, line), line)
      );
    const left = evaluate(expr.left, scope, line);
    const right = evaluate(expr.right, scope, line);
    switch (expr.op) {
      case '==':
        return valuesEqual(left, right);
      case '!=':
        return !valuesEqual(left, right);
      case '+':
        if (typeof left === 'string' && typeof right === 'string') return left + right;
        if (Array.isArray(left) && Array.isArray(right)) return [...left, ...right];
        if (typeof left === 'string' || typeof right === 'string')
          return fail(
            line,
            'type',
            `Cannot add ${typeName(left)} and ${typeName(right)}: convert with str() first`,
          );
        return number(left, line, '+') + number(right, line, '+');
      case '-':
        return number(left, line, '-') - number(right, line, '-');
      case '*':
        return number(left, line, '*') * number(right, line, '*');
      case '/': {
        const divisor = number(right, line, '/');
        if (divisor === 0) return fail(line, 'value', 'Division by zero');
        return number(left, line, '/') / divisor;
      }
      case '%': {
        const divisor = number(right, line, '%');
        if (divisor === 0) return fail(line, 'value', 'Division by zero');
        return number(left, line, '%') % divisor;
      }
      default: {
        const ordered =
          (typeof left === 'number' && typeof right === 'number') ||
          (typeof left === 'string' && typeof right === 'string');
        if (!ordered)
          return fail(line, 'type', `Cannot compare ${typeName(left)} with ${typeName(right)}`);
        const [a, b] = [left, right] as [number, number];
        return expr.op === '<'
          ? a < b
          : expr.op === '<='
            ? a <= b
            : expr.op === '>'
              ? a > b
              : a >= b;
      }
    }
  }

  function call(name: string, args: Value[], line: number): Value {
    const builtin = Object.hasOwn(builtins, name) ? builtins[name] : undefined;
    if (builtin) return builtin(args, line);
    const fn = functions.get(name);
    if (!fn) return fail(line, 'name', `There is no function called "${name}"`);
    if (args.length !== fn.params.length)
      return fail(line, 'type', `${name}() takes ${fn.params.length} value(s), got ${args.length}`);
    if (depth >= limits.maxDepth)
      return fail(line, 'limit', 'Too many nested calls (endless recursion?)');
    const local = new Map(fn.params.map((param, i) => [param, args[i] as Value]));
    depth++;
    try {
      execBlock(fn.body, local, name);
      return null;
    } catch (signal) {
      if (signal instanceof Return) return signal.value;
      throw signal;
    } finally {
      depth--;
    }
  }

  function record(line: number, scope: Map<string, Value>, name: string | null): void {
    if (trace.length < limits.maxTrace)
      trace.push({ line, variables: snapshot(scope), scope: name });
  }

  function tick(line: number): void {
    steps++;
    if (steps > limits.maxSteps)
      fail(line, 'limit', `Stopped after ${limits.maxSteps} steps — the loop may never end`);
  }

  function execBlock(body: readonly Stmt[], scope: Map<string, Value>, name: string | null): void {
    for (const stmt of body) exec(stmt, scope, name);
  }

  function exec(stmt: Stmt, scope: Map<string, Value>, name: string | null): void {
    tick(stmt.line);
    switch (stmt.type) {
      case 'assign':
        scope.set(stmt.target, evaluate(stmt.value, scope, stmt.line));
        break;
      case 'assign-index': {
        const target = lookup(stmt.target, scope, stmt.line);
        if (!Array.isArray(target)) fail(stmt.line, 'type', `"${stmt.target}" is not a list`);
        const { list, at } = indexOf(target, evaluate(stmt.index, scope, stmt.line), stmt.line);
        list[at] = evaluate(stmt.value, scope, stmt.line);
        break;
      }
      case 'print':
        output.push(stmt.args.map((arg) => display(evaluate(arg, scope, stmt.line))).join(' '));
        break;
      case 'expr':
        evaluate(stmt.expr, scope, stmt.line);
        break;
      case 'function':
        functions.set(stmt.name, { params: stmt.params, body: stmt.body });
        break;
      case 'return':
        if (name === null) fail(stmt.line, 'type', '"return" only works inside a function');
        record(stmt.line, scope, name);
        throw new Return(stmt.value === null ? null : evaluate(stmt.value, scope, stmt.line));
      case 'if': {
        record(stmt.line, scope, name);
        const branch = stmt.branches.find((b) =>
          truthy(evaluate(b.cond, scope, stmt.line), stmt.line),
        );
        execBlock(branch ? branch.body : (stmt.otherwise ?? []), scope, name);
        return;
      }
      case 'while':
        while (truthy(evaluate(stmt.cond, scope, stmt.line), stmt.line)) {
          record(stmt.line, scope, name);
          execBlock(stmt.body, scope, name);
          tick(stmt.line);
        }
        record(stmt.line, scope, name);
        return;
      case 'for': {
        const iterable = evaluate(stmt.iterable, scope, stmt.line);
        const items = Array.isArray(iterable)
          ? [...iterable]
          : typeof iterable === 'string'
            ? charsOf(iterable)
            : fail(
                stmt.line,
                'type',
                `"for" needs a list, text or range(), got ${typeName(iterable)}`,
              );
        for (const item of items) {
          scope.set(stmt.variable, copy(item));
          record(stmt.line, scope, name);
          execBlock(stmt.body, scope, name);
        }
        return;
      }
    }
    record(stmt.line, scope, name);
  }

  let error: RunError | null = null;
  try {
    execBlock(program.body, globals, null);
  } catch (signal) {
    if (!(signal instanceof Failure)) throw signal;
    error = { line: signal.line, kind: signal.kind, message: signal.message };
  }
  return { variables: snapshot(globals), output, trace, steps, error };
}
