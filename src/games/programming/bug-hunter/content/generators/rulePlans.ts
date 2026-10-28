import { pick, randomInt, type RandomGenerator } from '@/domain/random';
import { formatTime, parseTime } from '../format';
import type {
  BugHunterProfile,
  ConditionalRule,
  FieldName,
  RecordRule,
  SchemaField,
  SequenceRule,
  SequenceRuleType,
  ValueRule,
} from '../types';
import {
  CODES_BY_LEVEL,
  DOMAINS,
  IDENTIFIER_FIELDS,
  LEVELS,
  NAMES,
  REGIONS,
  REQ_ALPHABET,
  ROLES,
  STATUSES,
  semver,
  type MutableRecord,
} from './fields';

type Subtlety = BugHunterProfile['violation'];

/**
 * A stated rule plus how to build items around it: a near-miss keeps an item legal but makes it
 * look suspicious; a violation breaks exactly this rule on one item. Both work on the whole list
 * because sequence rules relate an item to the items above it.
 */
export interface RulePlan<R extends RecordRule = RecordRule> {
  readonly rule: R;
  nearMiss(random: RandomGenerator, records: MutableRecord[], index: number): void;
  violate(
    random: RandomGenerator,
    records: MutableRecord[],
    index: number,
    subtlety: Subtlety,
  ): void;
}

const num = (record: MutableRecord | undefined, field: FieldName) => {
  const value = record?.[field];
  if (typeof value !== 'number') throw new Error(`${field} is not numeric`);
  return value;
};

/** Per-item plan: `nearMiss` and `violate` produce a new value for the item's field. */
function valuePlan(
  rule: ValueRule,
  nearMiss: (random: RandomGenerator, record: MutableRecord) => string | number,
  violation: Readonly<
    Record<Subtlety, (random: RandomGenerator, record: MutableRecord) => string | number>
  >,
): RulePlan<ValueRule> {
  return {
    rule,
    nearMiss(random, records, index) {
      const record = records[index] as MutableRecord;
      // Identifiers stay unique: a look-alike is a fair decoy, an exact duplicate is not.
      const taken = IDENTIFIER_FIELDS.has(rule.field)
        ? new Set(records.map((r) => r[rule.field]))
        : null;
      for (let attempt = 0; attempt < 8; attempt++) {
        const value = nearMiss(random, record);
        if (!taken?.has(value)) {
          record[rule.field] = value;
          return;
        }
      }
    },
    violate(random, records, index, subtlety) {
      const record = records[index] as MutableRecord;
      record[rule.field] = violation[subtlety](random, record);
    },
  };
}

/** Closed-set rule; subtle violations are typos, casing or plausible unlisted siblings. */
const oneOf = (
  field: FieldName,
  values: readonly string[],
  subtle: readonly string[],
  obvious: readonly string[],
  nearMisses: readonly string[] = values,
) =>
  valuePlan({ type: 'one-of', field, values }, (random) => pick(random, nearMisses), {
    subtle: (random) => pick(random, subtle),
    obvious: (random) => pick(random, obvious),
  });

/** Whole-number range; near-misses sit exactly on a bound, subtle violations just past one. */
const range = (
  field: FieldName,
  min: number,
  max: number,
  subtle: readonly number[],
  obvious: readonly number[],
) =>
  valuePlan({ type: 'range', field, min, max }, (random) => pick(random, [min, max]), {
    subtle: (random) => pick(random, subtle),
    obvious: (random) => pick(random, obvious),
  });

// ── Sequence rules ────────────────────────────────────────────────────────────────────────────────

const SEQUENCE_PLANS: Readonly<Record<SequenceRuleType, RulePlan<SequenceRule>>> = {
  consecutive: {
    rule: { type: 'consecutive', field: 'seq' },
    // Near-miss: shift the whole run so this item lands on a round number (1099 → 1100).
    nearMiss(_random, records, index) {
      const value = num(records[index], 'seq');
      const shift = Math.ceil(value / 100) * 100 - value;
      for (const record of records) record.seq = num(record, 'seq') + shift;
    },
    // A gap or a repeated number; every item below keeps counting from the wrong value.
    violate(random, records, index, subtlety) {
      const step = subtlety === 'subtle' ? pick(random, [0, 2]) : randomInt(random, 10, 40);
      for (const record of records.slice(index)) record.seq = num(record, 'seq') + step - 1;
    },
  },
  'ascending-time': {
    rule: { type: 'ascending-time', field: 'time' },
    // Near-miss: the same second as the line above (allowed: "same as or later").
    nearMiss(_random, records, index) {
      if (index > 0) (records[index] as MutableRecord).time = records[index - 1]?.time as string;
    },
    violate(random, records, index, subtlety) {
      const previous = parseTime(records[index - 1]?.time) as number;
      const back = subtlety === 'subtle' ? randomInt(random, 1, 4) : randomInt(random, 180, 900);
      (records[index] as MutableRecord).time = formatTime(previous - back);
    },
  },
  unique: {
    rule: { type: 'unique', field: 'req' },
    // Near-miss: an id one character away from another id in the list.
    nearMiss(random, records, index) {
      const other = pick(
        random,
        records.filter((_, i) => i !== index),
      );
      const chars = Array.from(String(other.req));
      const at = randomInt(random, 0, chars.length - 1);
      chars[at] = pick(
        random,
        REQ_ALPHABET.filter((c) => c !== chars[at]),
      );
      const lookAlike = chars.join('');
      if (records.every((r) => r.req !== lookAlike))
        (records[index] as MutableRecord).req = lookAlike;
    },
    // Subtle duplicates copy an id from far above; obvious ones from the line just above.
    violate(random, records, index, subtlety) {
      const source =
        subtlety === 'subtle' && index >= 3 ? randomInt(random, 0, index - 3) : index - 1;
      (records[index] as MutableRecord).req = records[source]?.req as string;
    },
  },
};

export const sequencePlan = (type: SequenceRuleType) => SEQUENCE_PLANS[type];

// ── Schema rules (data records) ───────────────────────────────────────────────────────────────────

const localPart = (random: RandomGenerator) => pick(random, NAMES);

const SCHEMA_PLANS: Readonly<Record<SchemaField, RulePlan<ValueRule>>> = {
  id: valuePlan(
    { type: 'digits', field: 'id', count: 4 },
    (random) => pick(random, [1000, 9999, 1001, 9998, 1010, 9990, 1100, 9900]),
    {
      subtle: (random) =>
        pick(random, [randomInt(random, 100, 999), randomInt(random, 10000, 10999)]),
      obvious: (random) =>
        pick(random, [randomInt(random, 10, 99), randomInt(random, 100000, 999999)]),
    },
  ),
  email: valuePlan(
    { type: 'email', field: 'email' },
    (random) => {
      const [name, domain] = [localPart(random), pick(random, DOMAINS)];
      return pick(random, [
        `${name}.${pick(random, NAMES)}@${domain}`,
        `${name}+qa@${domain}`,
        `${name}@eu.${domain}`,
        `${name}-2@${domain}`,
      ]);
    },
    {
      subtle: (random) => {
        const [name, domain] = [localPart(random), pick(random, DOMAINS)];
        return pick(random, [
          `${name}@@${domain}`,
          `${name}@${domain.replace('.', '')}`,
          `${name}@${domain.split('.')[0] ?? domain}.`,
        ]);
      },
      obvious: (random) => `${localPart(random)}.${pick(random, DOMAINS)}`,
    },
  ),
  status: oneOf(
    'status',
    STATUSES,
    ['actve', 'inactiv', 'pendng', 'Active', 'enabled', 'disabled'],
    ['deleted', 'banned', 'unknown'],
  ),
  retries: range('retries', 0, 5, [6, 7, 8, -1], [12, 20, -3]),
  role: oneOf('role', ROLES, ['viewr', 'Admin', 'editors', 'owner'], ['superuser', 'root']),
  region: oneOf(
    'region',
    REGIONS,
    ['eu-east', 'us-west', 'ap-north', 'eu_west'],
    ['moon-1', 'local'],
  ),
  port: range('port', 8000, 8999, [7999, 9000, 9001, 7990], [80, 443, 3000]),
  version: valuePlan(
    { type: 'semver', field: 'version' },
    (random) =>
      pick(random, [
        '10.0.0',
        '0.0.1',
        `${randomInt(random, 1, 3)}.${randomInt(random, 10, 19)}.0`,
      ]),
    {
      subtle: (random) => {
        const [major, minor, patch] = semver(random).split('.') as [string, string, string];
        return pick(random, [
          `${major}.${minor}`,
          `${major}.${minor}.${patch}.1`,
          `v${major}.${minor}.${patch}`,
          `${major}..${patch}`,
        ]);
      },
      obvious: (random) => pick(random, ['latest', 'beta', 'next']),
    },
  ),
  timeoutMs: valuePlan(
    { type: 'multiple-of', field: 'timeoutMs', step: 250 },
    // Legal but odd-looking: 1750, 2250 …
    (random) => 250 * (2 * randomInt(random, 1, 9) + 1),
    {
      // Round hundreds that are not multiples of 250: 1200, 1300, 2100 …
      subtle: (random) => {
        const hundreds = pick(
          random,
          Array.from({ length: 38 }, (_, i) => i + 3).filter((h) => (h * 100) % 250 !== 0),
        );
        return hundreds * 100;
      },
      obvious: (random) => pick(random, [1234, 999, 3333]),
    },
  ),
};

export const schemaPlan = (field: SchemaField) => SCHEMA_PLANS[field];

// ── Log value and conditional rules (multi-rule) ─────────────────────────────────────────────────

export const LOG_VALUE_PLANS: readonly RulePlan<ValueRule>[] = [
  // Near-misses never turn a line into ERROR, which could clash with the ERROR → 5xx rule.
  oneOf('level', LEVELS, ['WARNING', 'ERR', 'Info', 'WRN'], ['DEBUG', 'FATAL'], ['INFO', 'WARN']),
  range('ms', 0, 500, [501, 502, 505, 510], [900, 1500, 4000]),
];

/** "When level is ERROR, code is 500–599". */
export const ERROR_CODE_PLAN: RulePlan<ConditionalRule> = {
  rule: {
    type: 'implies',
    when: { field: 'level', equals: 'ERROR' },
    then: { field: 'code', min: 500, max: 599 },
  },
  // Near-miss: a 5xx code on a line that is not ERROR (the rule says nothing about those).
  nearMiss(random, records, index) {
    const record = records[index] as MutableRecord;
    record.level = 'WARN';
    record.code = pick(random, CODES_BY_LEVEL['ERROR'] ?? [503]);
  },
  violate(random, records, index, subtlety) {
    const record = records[index] as MutableRecord;
    record.level = 'ERROR';
    record.code =
      subtlety === 'subtle' ? pick(random, [400, 404, 409, 429]) : pick(random, [200, 201]);
  },
};
