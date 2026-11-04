import { msg, type Message } from '@/domain/shared';
import { parseTime } from '../format';
import type { DataRecord, FieldValue, RecordRule } from '../types';

/** An item that breaks a rule, with a human reason (used in explanations and review). */
export interface ItemViolation {
  readonly index: number;
  readonly reason: Message;
}

const REASON = 'programming:bugHunter.reason';

const isWhole = (value: FieldValue | undefined): value is number =>
  typeof value === 'number' && Number.isInteger(value);

const show = (value: FieldValue | undefined) =>
  typeof value === 'string' ? `"${value}"` : String(value);

const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/** Why an e-mail address is malformed (a predicate: "has no @"), or null when it is well-formed. */
export function emailProblem(value: FieldValue | undefined): Message | null {
  if (typeof value !== 'string') return msg(`${REASON}.emailProblem.notText`);
  const parts = value.split('@');
  if (parts.length === 1) return msg(`${REASON}.emailProblem.noAt`);
  if (parts.length > 2) return msg(`${REASON}.emailProblem.manyAt`);
  const [local, domain] = parts as [string, string];
  if (local === '') return msg(`${REASON}.emailProblem.noLocal`);
  if (!DOMAIN.test(domain)) return msg(`${REASON}.emailProblem.badDomain`, { domain });
  return null;
}

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** Reason why a single value breaks a per-item rule, or null when it complies. */
function valueProblem(rule: RecordRule, record: DataRecord): Message | null {
  switch (rule.type) {
    case 'one-of': {
      const value = record[rule.field];
      return typeof value === 'string' && rule.values.includes(value)
        ? null
        : msg(`${REASON}.oneOf`, {
            field: rule.field,
            value: show(value),
            values: rule.values.join(', '),
          });
    }
    case 'range': {
      const value = record[rule.field];
      return isWhole(value) && value >= rule.min && value <= rule.max
        ? null
        : msg(`${REASON}.range`, {
            field: rule.field,
            value: show(value),
            min: String(rule.min),
            max: String(rule.max),
          });
    }
    case 'digits': {
      const value = record[rule.field];
      if (isWhole(value) && value >= 0 && String(value).length === rule.count) return null;
      return isWhole(value) && value >= 0
        ? msg(`${REASON}.digits`, {
            field: rule.field,
            value: String(value),
            count: String(value).length,
            expected: String(rule.count),
          })
        : msg(`${REASON}.notWhole`, { field: rule.field, value: show(value) });
    }
    case 'email': {
      const problem = emailProblem(record[rule.field]);
      return problem === null
        ? null
        : msg(`${REASON}.email`, { field: rule.field, value: show(record[rule.field]), problem });
    }
    case 'semver': {
      const value = record[rule.field];
      return typeof value === 'string' && SEMVER.test(value)
        ? null
        : msg(`${REASON}.semver`, { field: rule.field, value: show(value) });
    }
    case 'multiple-of': {
      const value = record[rule.field];
      return isWhole(value) && value > 0 && value % rule.step === 0
        ? null
        : msg(`${REASON}.multipleOf`, {
            field: rule.field,
            value: show(value),
            step: String(rule.step),
          });
    }
    case 'implies': {
      if (record[rule.when.field] !== rule.when.equals) return null;
      const value = record[rule.then.field];
      return isWhole(value) && value >= rule.then.min && value <= rule.then.max
        ? null
        : msg(`${REASON}.implies`, {
            when: rule.when.field,
            equals: rule.when.equals,
            field: rule.then.field,
            value: show(value),
          });
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
  const add = (index: number, reason: Message) => found.push({ index, reason });

  switch (rule.type) {
    case 'consecutive':
      records.forEach((record, i) => {
        const value = record[rule.field];
        if (i === 0) {
          if (!isWhole(value))
            add(i, msg(`${REASON}.notWhole`, { field: rule.field, value: show(value) }));
          return;
        }
        const previous = records[i - 1]?.[rule.field];
        if (isWhole(previous) && value !== previous + 1) {
          add(
            i,
            msg(`${REASON}.consecutive`, {
              field: rule.field,
              value: show(value),
              previous: String(previous),
              expected: String(previous + 1),
            }),
          );
        }
      });
      return found;
    case 'ascending-time':
      records.forEach((record, i) => {
        const time = parseTime(record[rule.field]);
        if (time === null) {
          add(
            i,
            msg(`${REASON}.invalidTime`, { field: rule.field, value: show(record[rule.field]) }),
          );
          return;
        }
        const previous = i === 0 ? null : parseTime(records[i - 1]?.[rule.field]);
        if (previous !== null && time < previous) {
          add(
            i,
            msg(`${REASON}.earlier`, {
              field: rule.field,
              value: String(record[rule.field]),
              previous: String(records[i - 1]?.[rule.field]),
            }),
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
        else
          add(
            i,
            msg(`${REASON}.repeated`, { field: rule.field, value: show(value), item: earlier + 1 }),
          );
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
