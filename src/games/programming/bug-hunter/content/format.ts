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

const range = (field: FieldName, min: number, max: number) =>
  min === max ? `${field} is ${min}` : `${field} is a whole number from ${min} to ${max}`;

export function describeRecordRule(rule: RecordRule): string {
  switch (rule.type) {
    case 'consecutive':
      return `Each ${rule.field} is exactly 1 more than the ${rule.field} on the item above.`;
    case 'ascending-time':
      return `Each ${rule.field} is the same as or later than the ${rule.field} on the item above.`;
    case 'unique':
      return `No ${rule.field} repeats a ${rule.field} used on an earlier item.`;
    case 'one-of':
      return `${rule.field} is one of: ${rule.values.join(', ')}.`;
    case 'range':
      return `${range(rule.field, rule.min, rule.max)}.`;
    case 'digits':
      return `${rule.field} is a whole number with exactly ${rule.count} digits.`;
    case 'email':
      return `${rule.field} has exactly one "@", a name before it and a dotted domain after it (name@domain.tld).`;
    case 'semver':
      return `${rule.field} is three whole numbers separated by dots (major.minor.patch).`;
    case 'multiple-of':
      return `${rule.field} is a multiple of ${rule.step}.`;
    case 'implies':
      return `When ${rule.when.field} is ${rule.when.equals}, ${range(rule.then.field, rule.then.min, rule.then.max)}.`;
  }
}

export function describeCodeRule(rule: CodeRule): string {
  switch (rule.type) {
    case 'defined-before-use':
      return 'Every variable is assigned with “set” on an earlier line before it is read.';
    case 'close-opened':
      return 'Every “open x” is followed by a “close x” on a later line.';
    case 'write-while-open':
      return '“write … to x” only happens while x is open (after “open x”, before “close x”).';
    case 'camel-case':
      return 'Every name is camelCase: it starts with a lower-case letter and uses only letters and digits (no “_”).';
  }
}

export const ruleTexts = (content: BugHunterContent): string[] =>
  content.kind === 'code-rule'
    ? content.rules.map(describeCodeRule)
    : content.rules.map(describeRecordRule);
