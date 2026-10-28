import { parseTime } from '../format';
import type { DataRecord, FieldValue, RecordRule } from '../types';

/** An item that breaks a rule, with a human reason (used in explanations and review). */
export interface ItemViolation {
  readonly index: number;
  readonly reason: string;
}

const isWhole = (value: FieldValue | undefined): value is number =>
  typeof value === 'number' && Number.isInteger(value);

const show = (value: FieldValue | undefined) =>
  typeof value === 'string' ? `"${value}"` : String(value);

const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/** Why an e-mail address is malformed, or null when it is well-formed. */
export function emailProblem(value: FieldValue | undefined): string | null {
  if (typeof value !== 'string') return 'is not text';
  const parts = value.split('@');
  if (parts.length === 1) return 'has no "@"';
  if (parts.length > 2) return 'has more than one "@"';
  const [local, domain] = parts as [string, string];
  if (local === '') return 'has nothing before the "@"';
  if (!DOMAIN.test(domain)) return `has "${domain}" after the "@", which is not a dotted domain`;
  return null;
}

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** Reason why a single value breaks a per-item rule, or null when it complies. */
function valueProblem(rule: RecordRule, record: DataRecord): string | null {
  switch (rule.type) {
    case 'one-of': {
      const value = record[rule.field];
      return typeof value === 'string' && rule.values.includes(value)
        ? null
        : `${rule.field}=${show(value)} is not one of ${rule.values.join(', ')}`;
    }
    case 'range': {
      const value = record[rule.field];
      return isWhole(value) && value >= rule.min && value <= rule.max
        ? null
        : `${rule.field}=${show(value)} is outside ${rule.min}–${rule.max}`;
    }
    case 'digits': {
      const value = record[rule.field];
      if (isWhole(value) && value >= 0 && String(value).length === rule.count) return null;
      return isWhole(value) && value >= 0
        ? `${rule.field}=${value} has ${String(value).length} digits, not ${rule.count}`
        : `${rule.field}=${show(value)} is not a whole number`;
    }
    case 'email': {
      const problem = emailProblem(record[rule.field]);
      return problem === null ? null : `${rule.field} ${show(record[rule.field])} ${problem}`;
    }
    case 'semver': {
      const value = record[rule.field];
      return typeof value === 'string' && SEMVER.test(value)
        ? null
        : `${rule.field} ${show(value)} is not three whole numbers separated by dots`;
    }
    case 'multiple-of': {
      const value = record[rule.field];
      return isWhole(value) && value > 0 && value % rule.step === 0
        ? null
        : `${rule.field}=${show(value)} is not a multiple of ${rule.step}`;
    }
    case 'implies': {
      if (record[rule.when.field] !== rule.when.equals) return null;
      const value = record[rule.then.field];
      return isWhole(value) && value >= rule.then.min && value <= rule.then.max
        ? null
        : `${rule.when.field} is ${rule.when.equals} but ${rule.then.field}=${show(value)}`;
    }
    case 'consecutive':
    case 'ascending-time':
    case 'unique':
      return null;
  }
}

/** Every item that breaks `rule`, top to bottom. Sequence rules compare with the item above. */
export function recordRuleViolations(
  rule: RecordRule,
  records: readonly DataRecord[],
): ItemViolation[] {
  const found: ItemViolation[] = [];
  const add = (index: number, reason: string) => found.push({ index, reason });

  switch (rule.type) {
    case 'consecutive':
      records.forEach((record, i) => {
        const value = record[rule.field];
        if (i === 0) {
          if (!isWhole(value)) add(i, `${rule.field}=${show(value)} is not a whole number`);
          return;
        }
        const previous = records[i - 1]?.[rule.field];
        if (isWhole(previous) && value !== previous + 1) {
          add(
            i,
            `${rule.field}=${show(value)} follows ${rule.field}=${previous}; it should be ${previous + 1}`,
          );
        }
      });
      return found;
    case 'ascending-time':
      records.forEach((record, i) => {
        const time = parseTime(record[rule.field]);
        if (time === null) {
          add(i, `${rule.field}=${show(record[rule.field])} is not a valid HH:MM:SS time`);
          return;
        }
        const previous = i === 0 ? null : parseTime(records[i - 1]?.[rule.field]);
        if (previous !== null && time < previous) {
          add(
            i,
            `${rule.field}=${String(record[rule.field])} is earlier than ${String(records[i - 1]?.[rule.field])} on the item above`,
          );
        }
      });
      return found;
    case 'unique': {
      const firstSeen = new Map<FieldValue | undefined, number>();
      records.forEach((record, i) => {
        const value = record[rule.field];
        const earlier = firstSeen.get(value);
        if (earlier === undefined) firstSeen.set(value, i);
        else add(i, `${rule.field}=${show(value)} was already used on item ${earlier + 1}`);
      });
      return found;
    }
    default:
      records.forEach((record, i) => {
        const problem = valueProblem(rule, record);
        if (problem !== null) add(i, problem);
      });
      return found;
  }
}
