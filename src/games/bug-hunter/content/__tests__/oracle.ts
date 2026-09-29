import type {
  BugHunterContent,
  CodeLine,
  CodeRule,
  DataRecord,
  FieldValue,
  RecordRule,
} from '../types';

/**
 * Independent re-implementation of every rule, written straight from the rule texts and sharing no
 * code with the generator or `solvers/`. Tests use it to confirm that each challenge has exactly
 * one violating item and that it is the solution.
 */

export interface OracleHit {
  readonly index: number;
  readonly rule: number;
}

const seconds = (value: FieldValue | undefined) => {
  const parts = String(value).split(':');
  if (parts.length !== 3 || parts.some((p) => !/^\d\d$/.test(p))) return Number.NaN;
  const [h, m, s] = parts.map(Number) as [number, number, number];
  return m > 59 || s > 59 ? Number.NaN : (h * 60 + m) * 60 + s;
};

const whole = (value: FieldValue | undefined): value is number =>
  typeof value === 'number' && Number.isInteger(value);

function recordBreaks(rule: RecordRule, records: readonly DataRecord[], i: number): boolean {
  const record = records[i] as DataRecord;
  switch (rule.type) {
    case 'consecutive':
      return i > 0 && Number(record[rule.field]) - Number(records[i - 1]?.[rule.field]) !== 1;
    case 'ascending-time': {
      const now = seconds(record[rule.field]);
      if (Number.isNaN(now)) return true;
      return i > 0 && now < seconds(records[i - 1]?.[rule.field]);
    }
    case 'unique':
      return records.slice(0, i).some((earlier) => earlier[rule.field] === record[rule.field]);
    case 'one-of': {
      const value = record[rule.field];
      return typeof value !== 'string' || rule.values.indexOf(value) === -1;
    }
    case 'range': {
      const value = record[rule.field];
      return !whole(value) || value < rule.min || value > rule.max;
    }
    case 'digits': {
      const value = record[rule.field];
      return !whole(value) || !new RegExp(`^\\d{${rule.count}}$`).test(String(value));
    }
    case 'email':
      return !/^[^@]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(String(record[rule.field]));
    case 'semver': {
      const value = record[rule.field];
      if (typeof value !== 'string') return true;
      const parts = value.split('.');
      return parts.length !== 3 || parts.some((p) => !/^(0|[1-9][0-9]*)$/.test(p));
    }
    case 'multiple-of': {
      const value = record[rule.field];
      return !whole(value) || value <= 0 || value % rule.step !== 0;
    }
    case 'implies': {
      if (record[rule.when.field] !== rule.when.equals) return false;
      const value = record[rule.then.field];
      return !whole(value) || value < rule.then.min || value > rule.then.max;
    }
  }
}

function variablesRead(line: CodeLine): string[] {
  if (line.op === 'print' || line.op === 'write') return [line.value];
  if (line.op !== 'set') return [];
  const values = line.expr.right ? [line.expr.left, line.expr.right.value] : [line.expr.left];
  return values.filter((v): v is string => typeof v === 'string');
}

function identifiers(line: CodeLine): string[] {
  if (line.op === 'set') return [line.target, ...variablesRead(line)];
  if (line.op === 'write') return [line.value, line.resource];
  if (line.op === 'print') return [line.value];
  return [line.resource];
}

function codeBreaks(rule: CodeRule, lines: readonly CodeLine[], i: number): boolean {
  const line = lines[i] as CodeLine;
  const before = lines.slice(0, i);
  switch (rule.type) {
    case 'defined-before-use': {
      const assigned = before.flatMap((l) => (l.op === 'set' ? [l.target] : []));
      return variablesRead(line).some((name) => !assigned.includes(name));
    }
    case 'close-opened':
      return (
        line.op === 'open' &&
        !lines.slice(i + 1).some((l) => l.op === 'close' && l.resource === line.resource)
      );
    case 'write-while-open': {
      if (line.op !== 'write') return false;
      const lastOpen = before.findLastIndex((l) => l.op === 'open' && l.resource === line.resource);
      const lastClose = before.findLastIndex(
        (l) => l.op === 'close' && l.resource === line.resource,
      );
      return lastOpen === -1 || lastClose > lastOpen;
    }
    case 'camel-case':
      return identifiers(line).some((name) => !/^[a-z][A-Za-z0-9]*$/.test(name));
  }
}

/** Every (item, rule) pair where the item breaks the rule. */
export function oracle(
  content: BugHunterContent,
  rulesOverride?: readonly CodeRule[],
): OracleHit[] {
  const hits: OracleHit[] = [];
  if (content.kind === 'code-rule') {
    (rulesOverride ?? content.rules).forEach((rule, r) => {
      content.lines.forEach((_, i) => {
        if (codeBreaks(rule, content.lines, i)) hits.push({ index: i, rule: r });
      });
    });
  } else {
    content.rules.forEach((rule, r) => {
      content.records.forEach((_, i) => {
        if (recordBreaks(rule, content.records, i)) hits.push({ index: i, rule: r });
      });
    });
  }
  return hits;
}
