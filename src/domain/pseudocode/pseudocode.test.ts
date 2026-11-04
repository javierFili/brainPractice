import { en } from '@/test/i18n';
import { parseExpression, parseProgram, SyntaxProblem } from './parse';
import { display, literal } from './run';
import { execute, executeOrThrow } from './source';

const run = (source: string) => executeOrThrow(source);
const vars = (source: string) => run(source).variables;

describe('pseudocode — values and expressions', () => {
  it('stores numbers, text, booleans, lists and none', () => {
    expect(vars('age = 25\nname = "Carlos"\nactive = true\nxs = [1, 2]\nnothing = none')).toEqual({
      age: 25,
      name: 'Carlos',
      active: true,
      xs: [1, 2],
      nothing: null,
    });
  });

  it('respects arithmetic precedence and parentheses', () => {
    expect(vars('a = 2 + 3 * 4\nb = (2 + 3) * 4\nc = 10 - 4 - 3\nd = 7 % 3\ne = 7 / 2')).toEqual({
      a: 14,
      b: 20,
      c: 3,
      d: 1,
      e: 3.5,
    });
  });

  it('evaluates comparisons and logic with short-circuit', () => {
    expect(
      vars(
        'x = 10\na = x > 5 and x < 20\nb = not x > 5\nc = x == 3 or x != 3\nd = false and missing',
      ),
    ).toEqual({ x: 10, a: true, b: false, c: true, d: false });
  });

  it('rejects chained comparisons instead of misreading them', () => {
    expect(() => parseExpression('1 < x < 5')).toThrow(SyntaxProblem);
    try {
      parseExpression('1 < x < 5');
    } catch (problem) {
      expect(en((problem as SyntaxProblem).text)).toMatch(/and/);
    }
  });

  it('concatenates text and refuses to mix text and numbers', () => {
    expect(vars('s = "Hi " + "Ada"')).toEqual({ s: 'Hi Ada' });
    const result = run('n = 3\ns = "n = " + n');
    expect(result.error).toMatchObject({ line: 2, kind: 'type' });
    expect(en(result.error?.message ?? '')).toMatch(/str\(\)/);
    expect(vars('n = 3\ns = "n = " + str(n)')).toMatchObject({ s: 'n = 3' });
  });

  it('indexes lists and text, and explains out-of-range indexes', () => {
    expect(vars('xs = [4, 5, 6]\na = xs[0]\nb = xs[len(xs) - 1]\nc = "abc"[1]')).toMatchObject({
      a: 4,
      b: 6,
      c: 'b',
    });
    const outside = run('xs = [4, 5, 6]\nv = xs[3]').error;
    expect(outside).toMatchObject({ line: 2, kind: 'index' });
    expect(en(outside?.message ?? '')).toMatch(/0 to 2/);
  });

  it('reports variables used before being set, with the line', () => {
    expect(run('a = 1\nb = c + 1').error).toMatchObject({ line: 2, kind: 'name' });
  });

  it('requires true/false in conditions', () => {
    expect(run('x = 1\nif x:\n    y = 2').error).toMatchObject({ kind: 'type' });
  });
});

describe('pseudocode — control flow', () => {
  it('takes exactly one branch of if / elif / else', () => {
    const program = (x: number) =>
      vars(`x = ${x}\nif x > 5:\n    r = "A"\nelif x > 0:\n    r = "B"\nelse:\n    r = "C"`)['r'];
    expect([program(10), program(3), program(-1)]).toEqual(['A', 'B', 'C']);
  });

  it('loops with while, for over lists and range()', () => {
    expect(vars('n = 3\ntotal = 0\nwhile n > 0:\n    total = total + n\n    n = n - 1')).toEqual({
      n: 0,
      total: 6,
    });
    expect(vars('total = 0\nfor x in [2, 4, 6]:\n    total = total + x')).toMatchObject({
      total: 12,
    });
    expect(vars('s = 0\nfor i in range(1, 4):\n    s = s + i')).toMatchObject({ s: 6, i: 3 });
    expect(vars('c = 0\nfor i in range(3):\n    c = c + 1')).toMatchObject({ c: 3 });
  });

  it('stops runaway loops with a clear message', () => {
    const result = run('x = 1\nwhile x > 0:\n    x = x + 1');
    expect(result.error).toMatchObject({ kind: 'limit', line: expect.any(Number) as unknown });
  });

  it('calls functions with parameters, local scope and return values', () => {
    const result = run(
      'function area(w, h):\n    a = w * h\n    return a\n\nresult = area(3, 4)\nprint(result)',
    );
    expect(result.variables).toEqual({ result: 12 });
    expect(result.output).toEqual(['12']);
  });

  it('returns none from a function without return, and checks argument counts', () => {
    expect(vars('function f(x):\n    y = x\nv = f(1)')).toEqual({ v: null });
    expect(run('function f(x):\n    return x\nv = f(1, 2)').error).toMatchObject({ kind: 'type' });
  });

  it('supports recursion within the depth limit', () => {
    const fact =
      'function fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\n';
    expect(vars(`${fact}v = fact(5)`)).toEqual({ v: 120 });
    expect(run('function f(n):\n    return f(n + 1)\nv = f(0)').error).toMatchObject({
      kind: 'limit',
    });
  });

  it('mutates lists through append and index assignment', () => {
    expect(vars('xs = []\nappend(xs, 1)\nappend(xs, 2)\nxs[0] = 9')).toEqual({ xs: [9, 2] });
  });

  it('prints values the way a learner expects', () => {
    expect(run('print("Total:", 3, true, [1, "a"])').output).toEqual(['Total: 3 true [1, "a"]']);
  });
});

describe('pseudocode — trace, inputs and syntax errors', () => {
  it('records executed lines and variables after each step', () => {
    const { trace } = run('x = 1\nfor i in [1, 2]:\n    x = x * 2');
    expect(trace.map((s) => s.line)).toEqual([1, 2, 3, 2, 3]);
    expect(trace.at(-1)?.variables).toEqual({ x: 4, i: 2 });
  });

  it('starts from given inputs', () => {
    expect(executeOrThrow('y = x + 1', { x: 41 }).variables).toEqual({ x: 41, y: 42 });
  });

  it('ignores comments and blank lines', () => {
    expect(vars('# a comment\n\nx = 1  # trailing\ns = "# not a comment"')).toEqual({
      x: 1,
      s: '# not a comment',
    });
  });

  it.each([
    ['if x > 1\n    y = 1', 1, /":"/],
    ['if true:\ny = 1', 1, /indented/],
    ['x = 1\n    y = 2', 2, /indentation/],
    ['else:\n    y = 1', 1, /follow/],
    ['s = "open', 1, /quote/],
    ['x = 1 +', 1, /early/],
    ['if true:\n    x = 1\nelse x > 2:\n    x = 2', 3, /elif/],
  ])('reports a syntax error in %j at line %i', (source, line, message) => {
    const parsed = parseProgram(source);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error.line).toBe(line);
      expect(en(parsed.error.message)).toMatch(message);
    }
  });

  it('formats values as literals and as output', () => {
    expect([
      literal('a'),
      literal(true),
      literal(null),
      literal([1, 'b']),
      literal(0.1 + 0.2),
    ]).toEqual(['"a"', 'true', 'none', '[1, "b"]', '0.3']);
    expect(display('a')).toBe('a');
  });

  it('never executes host JavaScript', () => {
    expect(execute('x = constructor("return 1")()').ok).toBe(false);
    // Names that exist on every JavaScript object are just unknown names here.
    for (const name of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
      expect(executeOrThrow(`x = ${name}(1)`).error).toMatchObject({ kind: 'name' });
      // …and never operators: `1 toString 2` is a syntax error, not a method call.
      expect(parseProgram(`x = 1 ${name} 2`).ok).toBe(false);
    }
  });
});
