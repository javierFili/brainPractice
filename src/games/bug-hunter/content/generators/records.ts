import { locateResponse } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { pick, randomInt, sample, shuffle, type RandomGenerator } from '@/domain/random';
import type { ProgrammingSkill } from '@/domain/shared';
import { explainViolation, findViolations } from '../solvers/violations';
import type {
  BugHunterProfile,
  DataRecord,
  FieldName,
  LogField,
  RecordContent,
  RecordField,
  RecordRule,
} from '../types';
import type { BugHunterDraft } from './draft';
import { baseRecords, IDENTIFIER_FIELDS } from './fields';
import {
  ERROR_CODE_PLAN,
  LOG_VALUE_PLANS,
  schemaPlan,
  sequencePlan,
  type RulePlan,
} from './rulePlans';

const LOG_ORDER: readonly LogField[] = [
  'time',
  'seq',
  'level',
  'svc',
  'path',
  'code',
  'ms',
  'user',
  'req',
];
const RECORD_ORDER: readonly RecordField[] = [
  'id',
  'name',
  'email',
  'status',
  'retries',
  'role',
  'region',
  'port',
  'version',
  'timeoutMs',
  'team',
];

/** Fields a rule mentions; they must all be shown. */
function fieldsOf(rule: RecordRule): FieldName[] {
  return rule.type === 'implies' ? [rule.when.field, rule.then.field] : [rule.field];
}

/** Required fields plus `noise` more that no rule mentions, in canonical column order. */
function chooseFields<F extends FieldName>(
  random: RandomGenerator,
  order: readonly F[],
  required: ReadonlySet<FieldName>,
  noise: number,
): F[] {
  const optional = order.filter((f) => !required.has(f));
  const extra = new Set<FieldName>(sample(random, optional, Math.min(noise, optional.length)));
  return order.filter((f) => required.has(f) || extra.has(f));
}

interface ArtifactSpec<C extends RecordContent> {
  readonly plans: readonly RulePlan[];
  /** The rule the bug breaks; chosen up front so every rule of the pool is broken equally often. */
  readonly broken: RulePlan;
  readonly fields: C['fields'];
  readonly build: (records: readonly DataRecord[]) => C;
  readonly prompt: string;
  readonly skills: readonly ProgrammingSkill[];
}

/**
 * Builds valid records, turns `distractors` of them into near-misses (round-robin over the rules
 * so every rule gets one), breaks one rule on one item, and accepts the candidate only if the
 * checker finds exactly that single violation.
 */
function recordDraft<C extends RecordContent>(
  random: RandomGenerator,
  profile: BugHunterProfile,
  spec: ArtifactSpec<C>,
): BugHunterDraft {
  const count = profile.elementCount;
  const { content, violation } = retryGeneration(`${spec.prompt} artifact`, () => {
    const records = baseRecords(random, spec.fields, count);
    const target = randomInt(random, 1, count - 1);
    const { broken } = spec;
    const decoys = shuffle(
      random,
      [...records.keys()].filter((i) => i !== target),
    ).slice(0, Math.min(profile.distractors, count - 1));
    decoys.forEach((index, i) => {
      spec.plans[i % spec.plans.length]?.nearMiss(random, records, index);
    });
    broken.violate(random, records, target, profile.violation);

    const candidate = spec.build(records);
    const found = findViolations(candidate);
    const only = found[0];
    if (found.length !== 1 || only?.index !== target) return null;
    if (!onlyDuplicateIsTheBug(records, spec.fields, target, broken.rule)) return null;
    return { content: candidate, violation: only };
  });

  return {
    prompt: spec.prompt,
    content,
    response: locateResponse(count, violation.index),
    explanation: explainViolation(violation, content.rules.length),
    skills: spec.skills,
  };
}

/**
 * Identifier fields must never repeat, except for the one duplicate that is itself the stated
 * violation (a repeated `req` under "unique", a repeated `seq` under "consecutive").
 */
function onlyDuplicateIsTheBug(
  records: readonly DataRecord[],
  fields: readonly FieldName[],
  target: number,
  broken: RecordRule,
): boolean {
  return fields
    .filter((field) => IDENTIFIER_FIELDS.has(field))
    .every((field) => {
      const seen = new Set<unknown>();
      return records.every((record, i) => {
        const value = record[field];
        const repeated = seen.has(value);
        seen.add(value);
        const stated =
          (broken.type === 'unique' || broken.type === 'consecutive') && broken.field === field;
        return !repeated || (stated && i === target);
      });
    });
}

const ruleCount = (profile: BugHunterProfile, available: number) =>
  Math.min(profile.decisionCount, available);

/** Picks the rule to break uniformly from the pool, then fills up the rule set around it. */
function aroundBroken<T>(random: RandomGenerator, pool: readonly T[], count: number) {
  const broken = pick(random, pool);
  const rest = sample(
    random,
    pool.filter((item) => item !== broken),
    Math.min(count, pool.length) - 1,
  );
  return { broken, chosen: [broken, ...rest] };
}

export function sequenceAnomaly(
  random: RandomGenerator,
  profile: BugHunterProfile,
): BugHunterDraft {
  const { broken, chosen } = aroundBroken(
    random,
    profile.sequenceRules,
    ruleCount(profile, profile.sequenceRules.length),
  );
  const plans = shuffle(random, chosen).map(sequencePlan);
  const required = new Set<FieldName>(['time', 'level', ...plans.flatMap((p) => fieldsOf(p.rule))]);
  const fields = chooseFields(random, LOG_ORDER, required, profile.visualNoise);
  return recordDraft(random, profile, {
    plans,
    broken: sequencePlan(broken),
    fields,
    build: (records) => ({
      kind: 'sequence-anomaly',
      fields,
      records,
      rules: plans.map((p) => p.rule),
    }),
    prompt: 'Scan the log. Exactly one line breaks a rule — which one?',
    skills: ['attention', 'debugging', 'pattern-recognition'],
  });
}

export function schemaViolation(
  random: RandomGenerator,
  profile: BugHunterProfile,
): BugHunterDraft {
  const { broken, chosen: constrained } = aroundBroken(
    random,
    profile.schemaFields,
    ruleCount(profile, profile.schemaFields.length),
  );
  const plans = [...constrained]
    .sort((a, b) => RECORD_ORDER.indexOf(a) - RECORD_ORDER.indexOf(b))
    .map(schemaPlan);
  const required = new Set<FieldName>(['id', ...constrained]);
  // At least one field besides the constrained ones, so no record is a single bare value.
  const noise = Math.max(profile.visualNoise, constrained.includes('id') ? 1 : 0);
  const fields = chooseFields(random, RECORD_ORDER, required, noise);
  return recordDraft(random, profile, {
    plans,
    broken: schemaPlan(broken),
    fields,
    build: (records) => ({
      kind: 'schema-violation',
      fields,
      records,
      rules: plans.map((p) => p.rule),
    }),
    prompt: 'Validate the records against the schema. Exactly one record is invalid — which one?',
    skills: ['attention', 'debugging', 'abstraction'],
  });
}

/** One rule per family: order between lines, a single field, and a cross-field condition. */
export function multiRule(random: RandomGenerator, profile: BugHunterProfile): BugHunterDraft {
  const types = profile.sequenceRules.filter((t) => t !== 'unique');
  const relational = (types.length > 0 ? types : (['ascending-time'] as const)).map(sequencePlan);
  // Every rule of the pool is equally likely to be the broken one, whatever its family.
  const broken = pick<RulePlan>(random, [...relational, ...LOG_VALUE_PLANS, ERROR_CODE_PLAN]);
  const own = <P extends RulePlan>(family: readonly P[]) =>
    family.find((plan) => plan === broken) ?? pick(random, family);
  const order = own(relational);
  const field = own(LOG_VALUE_PLANS);
  const others: RulePlan[] = [field, ERROR_CODE_PLAN];
  const extra =
    Math.min(profile.decisionCount, 3) >= 3
      ? others
      : [others.includes(broken) ? broken : pick(random, others)];
  const plans = shuffle(random, [order, ...extra]);
  const required = new Set<FieldName>(['time', 'level', ...plans.flatMap((p) => fieldsOf(p.rule))]);
  const fields = chooseFields(random, LOG_ORDER, required, profile.visualNoise);
  return recordDraft(random, profile, {
    plans,
    fields,
    broken,
    build: (records) => ({ kind: 'multi-rule', fields, records, rules: plans.map((p) => p.rule) }),
    prompt:
      'Every log line must satisfy all the rules. Exactly one line breaks one of them — which one?',
    skills: ['attention', 'debugging', 'working-memory'],
  });
}
