import { ExecutionLimitError, evaluateCond, execute } from '../solvers/interpreter';
import type { Cond, Expr, Stmt } from '../types';

const num = (value: number) => ({ type: 'num', value }) as const;
const ref = (name: string) => ({ type: 'var', name }) as const;
const set = (target: string, expr: Expr): Stmt => ({ type: 'assign', target, expr });
const plus = (name: string, value: number): Stmt => ({
  type: 'assign',
  target: name,
  expr: { type: 'bin', op: '+', left: ref(name), right: num(value) },
});

describe('pseudocode interpreter', () => {
  it('runs assignments, arithmetic and swaps', () => {
    const program: Stmt[] = [
      set('a', num(3)),
      set('b', num(4)),
      {
        type: 'assign',
        target: 'a',
        expr: { type: 'bin', op: '*', left: ref('a'), right: ref('b') },
      },
      {
        type: 'assign',
        target: 'b',
        expr: { type: 'bin', op: '-', left: ref('b'), right: num(10) },
      },
      { type: 'swap', a: 'a', b: 'b' },
    ];
    expect(execute(program).env).toEqual({ a: -6, b: 12 });
  });

  it('evaluates comparisons and boolean operators', () => {
    const env = { a: 2, b: 2 };
    const cmp = (op: '<' | '<=' | '>' | '>=' | '=' | '≠'): Cond => ({
      type: 'cmp',
      op,
      left: ref('a'),
      right: ref('b'),
    });
    expect(['<', '<=', '>', '>=', '=', '≠'].map((op) => evaluateCond(cmp(op as '<'), env))).toEqual(
      [false, true, false, true, true, false],
    );
    expect(evaluateCond({ type: 'and', left: cmp('='), right: cmp('<') }, env)).toBe(false);
    expect(evaluateCond({ type: 'or', left: cmp('='), right: cmp('<') }, env)).toBe(true);
    expect(evaluateCond({ type: 'not', operand: cmp('=') }, env)).toBe(false);
  });

  it('follows branches, repeats and while loops', () => {
    const program: Stmt[] = [
      set('a', num(0)),
      set('b', num(0)),
      { type: 'repeat', times: 3, body: [plus('a', 2)] },
      {
        type: 'if',
        cond: { type: 'cmp', op: '>', left: ref('a'), right: num(5) },
        then: [plus('b', 1)],
        otherwise: [plus('b', 100)],
      },
      {
        type: 'while',
        cond: { type: 'cmp', op: '<', left: ref('a'), right: num(10) },
        body: [plus('a', 3)],
      },
    ];
    expect(execute(program)).toEqual({ env: { a: 12, b: 1 }, ifsEvaluated: 1 });
  });

  it('simulates tracing mistakes: flipped branch, off-by-one loop, missed last line', () => {
    const program: Stmt[] = [
      set('a', num(0)),
      { type: 'repeat', times: 3, body: [plus('a', 1)] },
      {
        type: 'if',
        cond: { type: 'cmp', op: '=', left: ref('a'), right: num(3) },
        then: [plus('a', 10)],
        otherwise: [],
      },
      plus('a', 100),
    ];
    expect(execute(program).env['a']).toBe(113);
    expect(execute(program, { flipIf: 0 }).env['a']).toBe(103);
    expect(execute(program, { loopDelta: 1 }).env['a']).toBe(104);
    expect(execute(program, { loopDelta: -1 }).env['a']).toBe(102);
    expect(execute(program, { dropLast: true }).env['a']).toBe(13);
  });

  it('stops runaway loops and undefined variables loudly', () => {
    const forever: Stmt[] = [
      set('a', num(0)),
      {
        type: 'while',
        cond: { type: 'cmp', op: '>=', left: ref('a'), right: num(0) },
        body: [plus('a', 1)],
      },
    ];
    expect(() => execute(forever)).toThrow(ExecutionLimitError);
    expect(() => execute([set('a', ref('zzz'))])).toThrow(ReferenceError);
  });
});
