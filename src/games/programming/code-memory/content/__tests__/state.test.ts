import { trace, UndefinedVariableError, valueAt } from '../solvers/state';
import type { Assignment } from '../types';

const lit = (target: string, value: number): Assignment => ({
  target,
  expr: { type: 'num', value },
});
const bin = (
  target: string,
  left: string,
  op: '+' | '-' | '*',
  right: number | string,
): Assignment => ({
  target,
  expr: {
    type: 'bin',
    op,
    left: { type: 'var', name: left },
    right: typeof right === 'number' ? { type: 'num', value: right } : { type: 'var', name: right },
  },
});

// x = 3; y = x + 2; x = y * 2; y = x - y
const program = [
  lit('x', 3),
  bin('y', 'x', '+', 2),
  bin('x', 'y', '*', 2),
  bin('y', 'x', '-', 'y'),
];

describe('assignment solver', () => {
  it('records the state after every line', () => {
    expect(trace(program)).toEqual([{ x: 3 }, { x: 3, y: 5 }, { x: 10, y: 5 }, { x: 10, y: 5 }]);
    expect(valueAt(program, 'x', null)).toBe(10);
    expect(valueAt(program, 'y', 2)).toBe(5);
  });

  it('models forgetting an update', () => {
    expect(valueAt(program, 'x', null, { type: 'skip', line: 2 })).toBe(3);
    expect(valueAt(program, 'y', null, { type: 'skip', line: 2 })).toBe(-2);
  });

  it('models reading stale (first) values', () => {
    // y = x - y with x read as 3 (its first value) instead of 10.
    expect(valueAt(program, 'y', null, { type: 'stale' })).toBe(-2);
  });

  it('rejects reading a variable before it is assigned', () => {
    expect(() => trace([bin('x', 'y', '+', 1)])).toThrow(UndefinedVariableError);
  });
});
