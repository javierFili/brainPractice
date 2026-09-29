import { codeRuleViolations } from '../solvers/codeRules';
import { emailProblem, recordRuleViolations } from '../solvers/recordRules';
import { explainViolation, findViolations } from '../solvers/violations';
import type { CodeLine, DataRecord, RecordRule } from '../types';

const indices = (rule: RecordRule, records: DataRecord[]) =>
  recordRuleViolations(rule, records).map((v) => v.index);

describe('record rules', () => {
  it('consecutive: a gap or a repeat breaks only the item where it happens', () => {
    const rule: RecordRule = { type: 'consecutive', field: 'seq' };
    expect(indices(rule, [{ seq: 1099 }, { seq: 1100 }, { seq: 1101 }])).toEqual([]);
    expect(indices(rule, [{ seq: 10 }, { seq: 12 }, { seq: 13 }])).toEqual([1]);
    expect(indices(rule, [{ seq: 10 }, { seq: 10 }, { seq: 11 }])).toEqual([1]);
  });

  it('ascending-time: equal times and minute rollovers are legal, going back is not', () => {
    const rule: RecordRule = { type: 'ascending-time', field: 'time' };
    const times = (...t: string[]) => t.map((time) => ({ time }));
    expect(indices(rule, times('12:04:59', '12:04:59', '12:05:00'))).toEqual([]);
    expect(indices(rule, times('12:05:01', '12:04:58', '12:05:03'))).toEqual([1]);
    expect(indices(rule, times('12:05:01', '12:5:02'))).toEqual([1]);
  });

  it('unique: only the repeat is flagged, not the first occurrence', () => {
    const rule: RecordRule = { type: 'unique', field: 'req' };
    expect(indices(rule, [{ req: 'ab23' }, { req: 'ab24' }, { req: 'ab23' }])).toEqual([2]);
  });

  it('value rules accept boundaries and reject values just past them', () => {
    expect(
      indices({ type: 'range', field: 'retries', min: 0, max: 5 }, [
        { retries: 0 },
        { retries: 5 },
        { retries: 6 },
        { retries: 2.5 },
      ]),
    ).toEqual([2, 3]);
    expect(
      indices({ type: 'digits', field: 'id', count: 4 }, [
        { id: 1000 },
        { id: 999 },
        { id: 10000 },
      ]),
    ).toEqual([1, 2]);
    expect(
      indices({ type: 'one-of', field: 'status', values: ['active'] }, [
        { status: 'active' },
        { status: 'Active' },
      ]),
    ).toEqual([1]);
    expect(
      indices({ type: 'multiple-of', field: 'timeoutMs', step: 250 }, [
        { timeoutMs: 1750 },
        { timeoutMs: 1200 },
      ]),
    ).toEqual([1]);
    expect(
      indices({ type: 'semver', field: 'version' }, [
        { version: '10.0.12' },
        { version: '1.4' },
        { version: 'v1.4.2' },
      ]),
    ).toEqual([1, 2]);
  });

  it('email: unusual but valid addresses pass', () => {
    for (const ok of ['ana.lopez@corp.io', 'ana+qa@corp.io', 'ana@eu.corp.io', 'ana-2@corp.io'])
      expect(emailProblem(ok)).toBeNull();
    expect(emailProblem('ana.corp.io')).toBe('has no "@"');
    expect(emailProblem('ana@@corp.io')).toBe('has more than one "@"');
    expect(emailProblem('ana@corpio')).toMatch(/not a dotted domain/);
    expect(emailProblem('ana@corp.')).toMatch(/not a dotted domain/);
  });

  it('implies: only constrains items that meet the condition', () => {
    const rule: RecordRule = {
      type: 'implies',
      when: { field: 'level', equals: 'ERROR' },
      then: { field: 'code', min: 500, max: 599 },
    };
    expect(
      indices(rule, [
        { level: 'WARN', code: 503 },
        { level: 'WARN', code: 404 },
        { level: 'ERROR', code: 502 },
        { level: 'ERROR', code: 404 },
      ]),
    ).toEqual([3]);
  });
});

describe('code rules', () => {
  const program: CodeLine[] = [
    { op: 'set', target: 'total', expr: { left: 0, right: null } },
    { op: 'open', resource: 'log' },
    { op: 'write', value: 'total', resource: 'log' },
    { op: 'close', resource: 'log' },
    { op: 'set', target: 'total', expr: { left: 'total', right: { op: '+', value: 1 } } },
  ];

  it('a valid program breaks nothing', () => {
    for (const type of [
      'defined-before-use',
      'close-opened',
      'write-while-open',
      'camel-case',
    ] as const)
      expect(codeRuleViolations({ type }, program)).toEqual([]);
  });

  it('flags a read before assignment and says where the variable is first set', () => {
    const lines: CodeLine[] = [{ op: 'print', value: 'total' }, ...program];
    const [violation] = codeRuleViolations({ type: 'defined-before-use' }, lines);
    expect(violation).toEqual({
      index: 0,
      reason: 'it reads total, which has not been assigned yet (it is first set on line 2)',
    });
  });

  it('flags the open that is never closed, and a write after close', () => {
    const unclosed = program.filter((l) => l.op !== 'close');
    expect(codeRuleViolations({ type: 'close-opened' }, unclosed).map((v) => v.index)).toEqual([1]);
    const late: CodeLine[] = [...program, { op: 'write', value: 'total', resource: 'log' }];
    expect(codeRuleViolations({ type: 'write-while-open' }, late)).toEqual([
      { index: 5, reason: 'it writes to log, which was already closed on line 4' },
    ]);
  });

  it('camelCase allows digits and inner capitals but not snake or Pascal case', () => {
    const named = (target: string): CodeLine[] => [
      { op: 'set', target, expr: { left: 1, right: null } },
    ];
    expect(codeRuleViolations({ type: 'camel-case' }, named('v2Total'))).toEqual([]);
    expect(codeRuleViolations({ type: 'camel-case' }, named('total_price'))).toHaveLength(1);
    expect(codeRuleViolations({ type: 'camel-case' }, named('TotalPrice'))).toHaveLength(1);
  });
});

describe('findViolations / explainViolation', () => {
  it('names the item, the rule number and the reason', () => {
    const content = {
      kind: 'schema-violation' as const,
      fields: ['id' as const, 'retries' as const],
      records: [
        { id: 1000, retries: 5 },
        { id: 1001, retries: 6 },
      ],
      rules: [
        { type: 'digits' as const, field: 'id' as const, count: 4 },
        { type: 'range' as const, field: 'retries' as const, min: 0, max: 5 },
      ],
    };
    const found = findViolations(content);
    expect(found).toHaveLength(1);
    expect(explainViolation(found[0] as (typeof found)[number], 2)).toBe(
      'Item 2 is the bug: retries=6 is outside 0–5. It breaks rule 2: retries is a whole number from 0 to 5.',
    );
  });
});
