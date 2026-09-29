import { pick, randomInt, weightedPick, type RandomGenerator } from '@/domain/random';
import { formatTime } from '../format';
import type { FieldName, FieldValue } from '../types';

/** A record while it is being built; frozen into a `DataRecord` once the challenge is accepted. */
export type MutableRecord = Partial<Record<FieldName, FieldValue>>;

export const NAMES = [
  'ana',
  'luis',
  'mei',
  'omar',
  'sara',
  'ivan',
  'nora',
  'tariq',
  'eva',
  'jon',
  'lena',
  'raj',
  'yuki',
  'pablo',
  'zoe',
  'kofi',
];
export const DOMAINS = ['corp.io', 'mail.dev', 'example.org', 'shop.net', 'acme.co'];
const TEAMS = ['core', 'infra', 'web', 'data', 'mobile'];
const SERVICES = ['auth', 'billing', 'search', 'orders', 'catalog', 'mailer'];
const PATHS = ['/api/orders', '/api/users', '/login', '/health', '/api/cart', '/search'];

export const STATUSES = ['active', 'inactive', 'pending'];
export const ROLES = ['admin', 'editor', 'viewer'];
export const REGIONS = ['eu-west', 'us-east', 'ap-south'];
export const LEVELS = ['INFO', 'WARN', 'ERROR'];

/** HTTP codes that go naturally with each log level (ERROR is always 5xx). */
export const CODES_BY_LEVEL: Readonly<Record<string, readonly number[]>> = {
  INFO: [200, 201, 204, 301, 304],
  WARN: [400, 401, 403, 404, 409, 429],
  ERROR: [500, 502, 503, 504],
};

export const email = (random: RandomGenerator) => `${pick(random, NAMES)}@${pick(random, DOMAINS)}`;

export const semver = (random: RandomGenerator) =>
  `${randomInt(random, 0, 3)}.${randomInt(random, 0, 12)}.${randomInt(random, 0, 20)}`;

/**
 * Ordinary values for every non-sequence field. They satisfy every rule template this game can
 * state, so an artifact never contains an unstated "bug": only the injected one.
 */
const NORMAL: Readonly<
  Record<
    Exclude<FieldName, 'time' | 'seq' | 'req'>,
    (random: RandomGenerator, record: MutableRecord) => FieldValue
  >
> = {
  level: (random) => weightedPick(random, { INFO: 6, WARN: 2.5, ERROR: 1.5 }),
  svc: (random) => pick(random, SERVICES),
  path: (random) => pick(random, PATHS),
  code: (random, record) => pick(random, CODES_BY_LEVEL[String(record.level)] ?? [200, 204]),
  ms: (random) => randomInt(random, 3, 470),
  user: (random) => `u${randomInt(random, 100, 999)}`,
  id: (random) => randomInt(random, 1001, 9998),
  name: (random) => pick(random, NAMES),
  email,
  status: (random) => weightedPick(random, { active: 6, pending: 2, inactive: 2 }),
  retries: (random) => randomInt(random, 1, 4),
  role: (random) => pick(random, ROLES),
  region: (random) => pick(random, REGIONS),
  port: (random) => randomInt(random, 8001, 8998),
  version: semver,
  timeoutMs: (random) => 250 * randomInt(random, 2, 20),
  team: (random) => pick(random, TEAMS),
};

/**
 * Fields that read as keys. They are unique across items: an exact duplicate would look like a
 * bug to any programmer, so one only appears when it *is* the stated violation.
 */
export const IDENTIFIER_FIELDS: ReadonlySet<FieldName> = new Set<FieldName>([
  'id',
  'email',
  'user',
  'req',
  'seq',
]);

/** Generation order: fields listed later may depend on earlier ones (code depends on level). */
const GENERATION_ORDER = Object.keys(NORMAL) as (keyof typeof NORMAL)[];

// ── Sequence fields ───────────────────────────────────────────────────────────────────────────────

/** Request ids avoid 0/1 so no id can be confused with o/l. */
export const REQ_ALPHABET: readonly string[] = Array.from('abcdef23456789');

export const reqId = (random: RandomGenerator) =>
  Array.from({ length: 4 }, () => pick(random, REQ_ALPHABET)).join('');

function uniqueReqIds(random: RandomGenerator, count: number): string[] {
  const ids = new Set<string>();
  while (ids.size < count) ids.add(reqId(random));
  return [...ids];
}

/** `count` valid records showing `fields`: ascending times, consecutive seqs, unique identifiers. */
export function baseRecords(
  random: RandomGenerator,
  fields: readonly FieldName[],
  count: number,
): MutableRecord[] {
  const shown = new Set(fields);
  const reqs = uniqueReqIds(random, count);
  const seqStart = randomInt(random, 1000, 7999);
  let time = randomInt(random, 8 * 3600, 20 * 3600);
  const used: Partial<Record<FieldName, Set<FieldValue>>> = {};
  return Array.from({ length: count }, (_, i) => {
    const record: MutableRecord = {};
    if (i > 0) time += randomInt(random, 1, 45);
    if (shown.has('time')) record.time = formatTime(time);
    if (shown.has('seq')) record.seq = seqStart + i;
    if (shown.has('req')) record.req = reqs[i] as string;
    for (const field of GENERATION_ORDER) {
      if (!shown.has(field)) continue;
      let value = NORMAL[field](random, record);
      // Identifier pools hold at least 80 values, so a fresh one is always found quickly.
      if (IDENTIFIER_FIELDS.has(field)) {
        const seen = (used[field] ??= new Set());
        while (seen.has(value)) value = NORMAL[field](random, record);
        seen.add(value);
      }
      record[field] = value;
    }
    return record;
  });
}
