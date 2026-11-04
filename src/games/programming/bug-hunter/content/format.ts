import { msg, type Message } from '@/domain/shared';
import type {
  BugHunterContent,
  CodeExpr,
  CodeLine,
  CodeRule,
  DataRecord,
  FieldName,
  FieldValue,
  RecordRule,
} from './types';

// ── Time ──────────────────────────────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

/** Seconds since midnight → `HH:MM:SS`. */
export const formatTime = (seconds: number) =>
  `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;

/** `HH:MM:SS` → seconds since midnight, or null when malformed. */
export function parseTime(value: FieldValue | undefined): number | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d\d):(\d\d):(\d\d)$/.exec(value);
  if (!match) return null;
  const [h, m, s] = match.slice(1).map(Number) as [number, number, number];
  return m < 60 && s < 60 ? h * 3600 + m * 60 + s : null;
}

// ── Items ─────────────────────────────────────────────────────────────────────────────────────────

/** Log style: `key=value` pairs, strings unquoted. */
export const formatLogLine = (record: DataRecord, fields: readonly FieldName[]) =>
  fields.map((field) => `${field}=${String(record[field] ?? '')}`).join(' ');

/** Object-literal style: `{ id: 1042, status: "active" }`, strings quoted. */
export const formatRecord = (record: DataRecord, fields: readonly FieldName[]) =>
  `{ ${fields
    .map((field) => {
      const value = record[field];
      return `${field}: ${typeof value === 'number' ? String(value) : `"${value ?? ''}"`}`;
    })
    .join(', ')} }`;

const formatExpr = ({ left, right }: CodeExpr) =>
  right === null ? String(left) : `${String(left)} ${right.op} ${String(right.value)}`;

export function formatCodeLine(line: CodeLine): string {
  switch (line.op) {
    case 'set':
      return `set ${line.target} ← ${formatExpr(line.expr)}`;
    case 'print':
      return `print ${line.value}`;
    case 'open':
      return `open ${line.resource}`;
    case 'write':
      return `write ${line.value} to ${line.resource}`;
    case 'close':
      return `close ${line.resource}`;
  }
}

/** The text of every item, in display order (item n = index n − 1). */
export function itemTexts(content: BugHunterContent): string[] {
  switch (content.kind) {
    case 'code-rule':
      return content.lines.map(formatCodeLine);
    case 'schema-violation':
      return content.records.map((r) => formatRecord(r, content.fields));
    case 'sequence-anomaly':
    case 'multi-rule':
      return content.records.map((r) => formatLogLine(r, content.fields));
  }
}

// ── Rules ─────────────────────────────────────────────────────────────────────────────────────────

const RULE = 'programming:bugHunter.rule';

/** Field names and values are code and stay literal; numbers are passed as text for that reason. */
export function describeRecordRule(rule: RecordRule): Message {
  switch (rule.type) {
    case 'consecutive':
      return msg(`${RULE}.consecutive`, { field: rule.field });
    case 'ascending-time':
      return msg(`${RULE}.ascendingTime`, { field: rule.field });
    case 'unique':
      return msg(`${RULE}.unique`, { field: rule.field });
    case 'one-of':
      return msg(`${RULE}.oneOf`, { field: rule.field, values: rule.values.join(', ') });
    case 'range':
      return rule.min === rule.max
        ? msg(`${RULE}.exact`, { field: rule.field, value: String(rule.min) })
        : msg(`${RULE}.range`, {
            field: rule.field,
            min: String(rule.min),
            max: String(rule.max),
          });
    case 'digits':
      return msg(`${RULE}.digits`, { field: rule.field, count: rule.count });
    case 'email':
      return msg(`${RULE}.email`, { field: rule.field });
    case 'semver':
      return msg(`${RULE}.semver`, { field: rule.field });
    case 'multiple-of':
      return msg(`${RULE}.multipleOf`, { field: rule.field, step: String(rule.step) });
    case 'implies': {
      const { when, then } = rule;
      return then.min === then.max
        ? msg(`${RULE}.impliesExact`, {
            when: when.field,
            equals: when.equals,
            field: then.field,
            value: String(then.min),
          })
        : msg(`${RULE}.impliesRange`, {
            when: when.field,
            equals: when.equals,
            field: then.field,
            min: String(then.min),
            max: String(then.max),
          });
    }
  }
}

export function describeCodeRule(rule: CodeRule): Message {
  switch (rule.type) {
    case 'defined-before-use':
      return msg(`${RULE}.definedBeforeUse`);
    case 'close-opened':
      return msg(`${RULE}.closeOpened`);
    case 'write-while-open':
      return msg(`${RULE}.writeWhileOpen`);
    case 'camel-case':
      return msg(`${RULE}.camelCase`);
  }
}

export const ruleTexts = (content: BugHunterContent): Message[] =>
  content.kind === 'code-rule'
    ? content.rules.map(describeCodeRule)
    : content.rules.map(describeRecordRule);
