import { err, ok, type Result } from '../shared/result';
import { msg, type Message } from '../shared/text';
import type { BinaryOp, Expr, Program, Stmt } from './ast';

export interface ParseError {
  readonly line: number;
  /** What is wrong, for the learner (resolved by the UI in their language). */
  readonly message: Message;
}

/** Syntax messages are translation keys (`learn:pseudocode.parse.*`); the language stays English. */
const M = (key: string, values?: Readonly<Record<string, string>>) =>
  msg(`learn:pseudocode.parse.${key}`, values);

export class SyntaxProblem extends Error {
  constructor(
    readonly line: number,
    readonly text: Message,
  ) {
    super(text.key);
  }
}

// ── Tokens ──────────────────────────────────────────────────────────────────────────────────────

type Token =
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'string'; readonly value: string }
  | { readonly kind: 'name'; readonly value: string }
  | { readonly kind: 'op'; readonly value: string };

const KEYWORDS = new Set(['and', 'or', 'not', 'true', 'false', 'none', 'in']);
const OPERATORS = [
  '==',
  '!=',
  '<=',
  '>=',
  '+',
  '-',
  '*',
  '/',
  '%',
  '<',
  '>',
  '(',
  ')',
  '[',
  ']',
  ',',
  ':',
  '=',
];

export function tokenize(text: string, line: number): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const char = text.charAt(i);
    if (char === ' ' || char === '\t') {
      i++;
      continue;
    }
    if (char === '#') break;
    if (/[0-9]/.test(char)) {
      const match = /^\d+(\.\d+)?/.exec(text.slice(i)) as RegExpExecArray;
      tokens.push({ kind: 'number', value: Number(match[0]) });
      i += match[0].length;
      continue;
    }
    if (char === '"') {
      const end = text.indexOf('"', i + 1);
      if (end === -1) throw new SyntaxProblem(line, M('missingQuote'));
      tokens.push({ kind: 'string', value: text.slice(i + 1, end) });
      i = end + 1;
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text.slice(i)) as RegExpExecArray;
      tokens.push({ kind: 'name', value: match[0] });
      i += match[0].length;
      continue;
    }
    const op = OPERATORS.find((candidate) => text.startsWith(candidate, i));
    if (!op) throw new SyntaxProblem(line, M('unexpectedChar', { char }));
    tokens.push({ kind: 'op', value: op });
    i += op.length;
  }
  return tokens;
}

// ── Expressions (precedence climbing) ──────────────────────────────────────────────────────────

const PRECEDENCE: Readonly<Record<BinaryOp, number>> = {
  or: 1,
  and: 2,
  '==': 4,
  '!=': 4,
  '<': 4,
  '<=': 4,
  '>': 4,
  '>=': 4,
  '+': 5,
  '-': 5,
  '*': 6,
  '/': 6,
  '%': 6,
};

const COMPARISON = 4;

const binaryOpOf = (token: Token | undefined): BinaryOp | null => {
  if (!token || (token.kind !== 'op' && token.kind !== 'name')) return null;
  return Object.hasOwn(PRECEDENCE, token.value) ? (token.value as BinaryOp) : null;
};

class ExpressionParser {
  private position = 0;

  constructor(
    private readonly tokens: readonly Token[],
    private readonly line: number,
  ) {}

  parseAll(): Expr {
    const expr = this.expression(0);
    if (this.position < this.tokens.length) this.fail(M('trailing'));
    return expr;
  }

  private peek(offset = 0): Token | undefined {
    return this.tokens[this.position + offset];
  }

  private next(): Token {
    const token = this.tokens[this.position];
    if (!token) this.fail(M('endsEarly'));
    this.position++;
    return token;
  }

  private isOp(value: string): boolean {
    const token = this.peek();
    return token?.kind === 'op' && token.value === value;
  }

  private expect(value: string): void {
    if (!this.isOp(value)) this.fail(M('expected', { value }));
    this.position++;
  }

  private fail(message: Message): never {
    throw new SyntaxProblem(this.line, message);
  }

  private expression(minPrecedence: number): Expr {
    let left = this.unary();
    for (;;) {
      const op = binaryOpOf(this.peek());
      if (op === null || PRECEDENCE[op] < minPrecedence) return left;
      this.position++;
      const right = this.expression(PRECEDENCE[op] + 1);
      left = { type: 'binary', op, left, right };
      // Comparisons do not chain: `a < b < c` is rejected rather than silently misread.
      const following = binaryOpOf(this.peek());
      if (
        PRECEDENCE[op] === COMPARISON &&
        following !== null &&
        PRECEDENCE[following] === COMPARISON
      )
        this.fail(M('chainedComparison'));
    }
  }

  private unary(): Expr {
    const token = this.peek();
    if (token?.kind === 'op' && token.value === '-') {
      this.position++;
      return { type: 'unary', op: '-', operand: this.unary() };
    }
    if (token?.kind === 'name' && token.value === 'not') {
      this.position++;
      // `not` binds looser than comparisons: `not x > 3` means `not (x > 3)`.
      return { type: 'unary', op: 'not', operand: this.expression(3) };
    }
    return this.postfix(this.primary());
  }

  private postfix(expr: Expr): Expr {
    let current = expr;
    while (this.isOp('[')) {
      this.position++;
      const index = this.expression(0);
      this.expect(']');
      current = { type: 'index', target: current, index };
    }
    return current;
  }

  private primary(): Expr {
    const token = this.next();
    switch (token.kind) {
      case 'number':
        return { type: 'literal', value: token.value };
      case 'string':
        return { type: 'literal', value: token.value };
      case 'name': {
        if (token.value === 'true') return { type: 'literal', value: true };
        if (token.value === 'false') return { type: 'literal', value: false };
        if (token.value === 'none') return { type: 'literal', value: null };
        if (KEYWORDS.has(token.value)) this.fail(M('keywordHere', { word: token.value }));
        if (this.isOp('(')) {
          this.position++;
          const args = this.list(')');
          return { type: 'call', callee: token.value, args };
        }
        return { type: 'name', name: token.value };
      }
      case 'op':
        if (token.value === '(') {
          const inner = this.expression(0);
          this.expect(')');
          return inner;
        }
        if (token.value === '[') return { type: 'list', items: this.list(']') };
        return this.fail(M('unexpected', { token: token.value }));
    }
  }

  private list(close: string): Expr[] {
    const items: Expr[] = [];
    if (this.isOp(close)) {
      this.position++;
      return items;
    }
    for (;;) {
      items.push(this.expression(0));
      if (this.isOp(close)) {
        this.position++;
        return items;
      }
      this.expect(',');
    }
  }
}

export function parseExpression(text: string, line = 1): Expr {
  return new ExpressionParser(tokenize(text, line), line).parseAll();
}

// ── Statements (indentation blocks) ────────────────────────────────────────────────────────────

interface SourceLine {
  readonly number: number;
  readonly indent: number;
  readonly text: string;
}

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

function sourceLines(source: string): SourceLine[] {
  return source.split('\n').flatMap((raw, i) => {
    const withoutComment = stripComment(raw);
    if (withoutComment.trim() === '') return [];
    if (/^\t/.test(raw)) throw new SyntaxProblem(i + 1, M('tabs'));
    const indent = withoutComment.length - withoutComment.trimStart().length;
    return [{ number: i + 1, indent, text: withoutComment.trim() }];
  });
}

function stripComment(raw: string): string {
  let inString = false;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charAt(i);
    if (char === '"') inString = !inString;
    if (char === '#' && !inString) return raw.slice(0, i);
  }
  return raw;
}

class StatementParser {
  private position = 0;

  constructor(private readonly lines: readonly SourceLine[]) {}

  parseProgram(): Stmt[] {
    const body = this.block(0);
    const extra = this.lines[this.position];
    if (extra) throw new SyntaxProblem(extra.number, M('indentation'));
    return body;
  }

  private block(indent: number): Stmt[] {
    const body: Stmt[] = [];
    for (;;) {
      const line = this.lines[this.position];
      if (!line || line.indent < indent) return body;
      if (line.indent > indent) throw new SyntaxProblem(line.number, M('indentation'));
      this.position++;
      body.push(this.statement(line));
    }
  }

  /** The indented block after a line ending in ':'. */
  private childBlock(header: SourceLine): Stmt[] {
    const first = this.lines[this.position];
    if (!first || first.indent <= header.indent)
      throw new SyntaxProblem(header.number, M('needsBlock'));
    return this.block(first.indent);
  }

  private header(line: SourceLine, keyword: string): string {
    if (!line.text.endsWith(':'))
      throw new SyntaxProblem(line.number, M('needsColon', { keyword }));
    return line.text.slice(keyword.length, -1).trim();
  }

  private statement(line: SourceLine): Stmt {
    const { text, number } = line;
    const word = /^[A-Za-z_]+/.exec(text)?.[0] ?? '';
    const at = { line: number };

    switch (word) {
      case 'if':
        return this.ifStatement(line);
      case 'elif':
      case 'else':
        throw new SyntaxProblem(number, M('mustFollowIf', { word }));
      case 'while':
        return {
          ...at,
          type: 'while',
          cond: parseExpression(this.header(line, 'while'), number),
          body: this.childBlock(line),
        };
      case 'for': {
        const match = /^for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+(.+):$/.exec(text);
        if (!match) throw new SyntaxProblem(number, M('forSyntax'));
        return {
          ...at,
          type: 'for',
          variable: match[1] as string,
          iterable: parseExpression(match[2] as string, number),
          body: this.childBlock(line),
        };
      }
      case 'function': {
        const match = /^function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*:$/.exec(text);
        if (!match) throw new SyntaxProblem(number, M('functionSyntax'));
        const params = (match[2] as string)
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p !== '');
        if (params.some((p) => !NAME.test(p))) throw new SyntaxProblem(number, M('paramNames'));
        return {
          ...at,
          type: 'function',
          name: match[1] as string,
          params,
          body: this.childBlock(line),
        };
      }
      case 'return': {
        const rest = text.slice('return'.length).trim();
        return { ...at, type: 'return', value: rest === '' ? null : parseExpression(rest, number) };
      }
      case 'print': {
        if (/^print\s*\(/.test(text)) {
          const call = parseExpression(text, number);
          if (call.type === 'call') return { ...at, type: 'print', args: call.args };
        }
        break;
      }
    }

    const assignment = /^([A-Za-z_][A-Za-z0-9_]*)\s*(\[(.+)\])?\s*=(?!=)\s*(.+)$/.exec(text);
    if (assignment) {
      const target = assignment[1] as string;
      const index = assignment[3];
      const value = assignment[4] as string;
      if (KEYWORDS.has(target)) throw new SyntaxProblem(number, M('badTarget', { target }));
      return index === undefined
        ? { ...at, type: 'assign', target, value: parseExpression(value, number) }
        : {
            ...at,
            type: 'assign-index',
            target,
            index: parseExpression(index, number),
            value: parseExpression(value, number),
          };
    }
    return { ...at, type: 'expr', expr: parseExpression(text, number) };
  }

  private ifStatement(line: SourceLine): Stmt {
    const branches = [
      { cond: parseExpression(this.header(line, 'if'), line.number), body: this.childBlock(line) },
    ];
    let otherwise: Stmt[] | null = null;
    for (;;) {
      const next = this.lines[this.position];
      if (!next || next.indent !== line.indent) break;
      if (/^elif\b/.test(next.text)) {
        this.position++;
        branches.push({
          cond: parseExpression(this.header(next, 'elif'), next.number),
          body: this.childBlock(next),
        });
        continue;
      }
      if (/^else\b/.test(next.text)) {
        this.position++;
        if (this.header(next, 'else') !== '')
          throw new SyntaxProblem(next.number, M('elseCondition'));
        otherwise = this.childBlock(next);
      }
      break;
    }
    return { line: line.number, type: 'if', branches, otherwise };
  }
}

export function parseProgram(source: string): Result<Program, ParseError> {
  try {
    const body = new StatementParser(sourceLines(source)).parseProgram();
    return ok({ source, body });
  } catch (error) {
    if (error instanceof SyntaxProblem) return err({ line: error.line, message: error.text });
    throw error;
  }
}
