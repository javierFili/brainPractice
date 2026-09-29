import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

// ── Records (log lines and data records) ──────────────────────────────────────────────────────────

/** Fields of a log line. */
export type LogField = 'time' | 'seq' | 'level' | 'svc' | 'path' | 'code' | 'ms' | 'user' | 'req';

/** Fields of a data record (schema challenges). */
export type RecordField =
  | 'id'
  | 'name'
  | 'email'
  | 'status'
  | 'retries'
  | 'role'
  | 'region'
  | 'port'
  | 'version'
  | 'timeoutMs'
  | 'team';

export type FieldName = LogField | RecordField;

export type FieldValue = string | number;

/** One item of a record artifact. A field may be absent only because the artifact does not show it. */
export type DataRecord = Readonly<Partial<Record<FieldName, FieldValue>>>;

/** Rules that compare an item with the items above it. */
export type SequenceRule =
  /** Each value is exactly 1 more than the value on the item above. */
  | { readonly type: 'consecutive'; readonly field: FieldName }
  /** Each `HH:MM:SS` value is the same as or later than the one on the item above. */
  | { readonly type: 'ascending-time'; readonly field: FieldName }
  /** No value repeats one used on an earlier item. */
  | { readonly type: 'unique'; readonly field: FieldName };

/** Rules that look at one field of one item. */
export type ValueRule =
  | { readonly type: 'one-of'; readonly field: FieldName; readonly values: readonly string[] }
  | {
      readonly type: 'range';
      readonly field: FieldName;
      readonly min: number;
      readonly max: number;
    }
  | { readonly type: 'digits'; readonly field: FieldName; readonly count: number }
  | { readonly type: 'email'; readonly field: FieldName }
  | { readonly type: 'semver'; readonly field: FieldName }
  | { readonly type: 'multiple-of'; readonly field: FieldName; readonly step: number };

/** Cross-field rule: when `when.field` equals a value, `then.field` must lie in [min, max]. */
export interface ConditionalRule {
  readonly type: 'implies';
  readonly when: { readonly field: FieldName; readonly equals: string };
  readonly then: { readonly field: FieldName; readonly min: number; readonly max: number };
}

export type RecordRule = SequenceRule | ValueRule | ConditionalRule;

export type SequenceRuleType = SequenceRule['type'];

// ── Pseudocode ────────────────────────────────────────────────────────────────────────────────────

export type ArithOp = '+' | '-' | '*';

/** A variable name (string) or a literal (number). */
export type Operand = string | number;

export interface CodeExpr {
  readonly left: Operand;
  readonly right: { readonly op: ArithOp; readonly value: Operand } | null;
}

export type CodeLine =
  | { readonly op: 'set'; readonly target: string; readonly expr: CodeExpr }
  | { readonly op: 'print'; readonly value: string }
  | { readonly op: 'open'; readonly resource: string }
  | { readonly op: 'write'; readonly value: string; readonly resource: string }
  | { readonly op: 'close'; readonly resource: string };

export type CodeRuleType =
  'defined-before-use' | 'close-opened' | 'write-while-open' | 'camel-case';

export interface CodeRule {
  readonly type: CodeRuleType;
}

// ── Content ───────────────────────────────────────────────────────────────────────────────────────

export type BugHunterContent =
  | {
      readonly kind: 'sequence-anomaly';
      readonly fields: readonly LogField[];
      readonly records: readonly DataRecord[];
      readonly rules: readonly SequenceRule[];
    }
  | {
      readonly kind: 'schema-violation';
      readonly fields: readonly RecordField[];
      readonly records: readonly DataRecord[];
      readonly rules: readonly ValueRule[];
    }
  | {
      readonly kind: 'multi-rule';
      readonly fields: readonly LogField[];
      readonly records: readonly DataRecord[];
      readonly rules: readonly RecordRule[];
    }
  | {
      readonly kind: 'code-rule';
      readonly lines: readonly CodeLine[];
      readonly rules: readonly CodeRule[];
    };

export type BugHunterKind = BugHunterContent['kind'];

export type RecordContent = Exclude<BugHunterContent, { kind: 'code-rule' }>;

export type AttentionChallenge = Challenge<'attention', BugHunterContent>;

// ── Difficulty ────────────────────────────────────────────────────────────────────────────────────

/** Record fields that have a schema rule template (see generators/templates.ts). */
export type SchemaField =
  'id' | 'email' | 'status' | 'retries' | 'role' | 'region' | 'port' | 'version' | 'timeoutMs';

export interface BugHunterProfile extends DifficultyProfile {
  /** Kinds that may appear at this level, with relative weights. */
  readonly kinds: Readonly<Partial<Record<BugHunterKind, number>>>;
  /** Items (records, log lines, code lines) in the artifact. */
  readonly elementCount: number;
  /** Rules stated at once; every item must be checked against all of them. */
  readonly decisionCount: number;
  /** Extra fields per item that no rule mentions. */
  readonly visualNoise: number;
  /** Valid items deliberately built as near-misses (boundary or unusual but legal values). */
  readonly distractors: number;
  /** How far the violating value is from a legal one. */
  readonly violation: 'obvious' | 'subtle';
  readonly sequenceRules: readonly SequenceRuleType[];
  readonly schemaFields: readonly SchemaField[];
  readonly codeRules: readonly CodeRuleType[];
}
