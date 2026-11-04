import { singleChoice } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { pick, randomInt, sample, shuffle, type RandomGenerator } from '@/domain/random';
import { msg } from '@/domain/shared';
import { fieldValue, formatRecord } from '../format';
import type { CodeMemoryProfile, DataRecord, Field } from '../types';
import { RELATIONS, SCHEMAS, type EntitySchema, type FieldSpec } from '../vocabulary';
import type { MemoryDraft } from './draft';
import { anchoredNear, column, nearValues, pickDistractors, type Similarity } from './values';

const ID_DOMAIN = { type: 'id' } as const;
const NAME_DOMAIN = { type: 'name' } as const;

const isAskable = (spec: FieldSpec) => spec.domain.type !== 'bool';

const schemaOf = (type: string) => SCHEMAS.find((schema) => schema.type === type) as EntitySchema;

/** `id` plus `count - 1` other fields, kept in schema order so records read naturally. */
function chooseFields(
  random: RandomGenerator,
  schema: EntitySchema,
  count: number,
  filter: (spec: FieldSpec) => boolean = () => true,
): FieldSpec[] {
  const others = schema.fields.filter((spec) => spec.name !== 'id' && filter(spec));
  const chosen = new Set(sample(random, others, Math.min(count - 1, others.length)));
  return schema.fields.filter((spec) => spec.name === 'id' || chosen.has(spec));
}

/** One record per row, every non-boolean column distinct so a value identifies its record. */
function buildTable(
  random: RandomGenerator,
  type: string,
  specs: readonly FieldSpec[],
  count: number,
  similarity: Similarity,
): DataRecord[] | null {
  const columns = specs.map((spec) => column(random, spec.domain, count, similarity));
  if (columns.some((values) => values === null)) return null;
  return Array.from({ length: count }, (_, row) => ({
    type,
    fields: specs.map((spec, i) => ({ name: spec.name, value: columns[i]?.[row] ?? '' })),
  }));
}

const specNamed = (type: string, name: string) =>
  schemaOf(type).fields.find((spec) => spec.name === name) as FieldSpec;

// ── record-recall ─────────────────────────────────────────────────────────────────────────────────

/** Several records of different types; recall one field of one of them. */
export function recordRecall(random: RandomGenerator, profile: CodeMemoryProfile): MemoryDraft {
  const { recordCount, fieldCount, similarity } = profile.records;
  return retryGeneration('record-recall', () => {
    const schemas = sample(random, SCHEMAS, recordCount);
    // Ids and names are drawn jointly so that, with high similarity, they interfere across records.
    const ids = column(random, ID_DOMAIN, recordCount, similarity);
    const names = column(random, NAME_DOMAIN, recordCount, similarity);
    if (ids === null || names === null) return null;
    const records: DataRecord[] = schemas.map((schema, row) => ({
      type: schema.type,
      fields: chooseFields(random, schema, fieldCount).map((spec): Field => {
        if (spec.domain.type === 'id') return { name: spec.name, value: ids[row] ?? '' };
        if (spec.domain.type === 'name') return { name: spec.name, value: names[row] ?? '' };
        return { name: spec.name, value: column(random, spec.domain, 1, similarity)?.[0] ?? '' };
      }),
    }));

    const recordIndex = randomInt(random, 0, records.length - 1);
    const record = records[recordIndex] as DataRecord;
    const askable = record.fields.filter((field) => isAskable(specNamed(record.type, field.name)));
    const asked = pick(random, askable);
    const spec = specNamed(record.type, asked.name);
    const seenElsewhere = records
      .filter((_, i) => i !== recordIndex)
      .flatMap((other) => other.fields.filter((field) => field.name === asked.name))
      .map((field) => field.value);
    const distractors = pickDistractors(
      random,
      asked.value,
      seenElsewhere,
      anchoredNear(random, asked.value, (v) => nearValues(spec.domain, v), profile.distractors + 1),
      profile.distractors,
    );
    if (distractors === null) return null;

    return {
      prompt: msg('programming:codeMemory.record.prompt', { field: asked.name, type: record.type }),
      content: { kind: 'record-recall', records, ask: { recordIndex, field: asked.name } },
      response: singleChoice(random, asked.value, distractors),
      explanation: msg('programming:codeMemory.record.explanation', {
        type: record.type,
        record: formatRecord(record),
        field: asked.name,
        value: asked.value,
      }),
      skills: ['working-memory', 'attention'],
    };
  });
}

// ── cross-reference ───────────────────────────────────────────────────────────────────────────────

/** Records of one type; locate a record by one field and recall another of its fields. */
export function crossReference(random: RandomGenerator, profile: CodeMemoryProfile): MemoryDraft {
  const { recordCount, fieldCount, similarity } = profile.records;
  return retryGeneration('cross-reference', () => {
    const schema = pick(random, SCHEMAS);
    const specs = chooseFields(random, schema, fieldCount);
    const records = buildTable(random, schema.type, specs, recordCount, similarity);
    if (records === null) return null;
    const askable = specs.filter(isAskable);
    if (askable.length < 2) return null;
    const [key, target] = sample(random, askable, 2) as [FieldSpec, FieldSpec];

    const recordIndex = randomInt(random, 0, records.length - 1);
    const record = records[recordIndex] as DataRecord;
    const keyValue = fieldValue(record, key.name) ?? '';
    const answer = fieldValue(record, target.name) ?? '';
    const otherTargets = records
      .filter((_, i) => i !== recordIndex)
      .map((other) => fieldValue(other, target.name) ?? '');
    const distractors = pickDistractors(
      random,
      answer,
      otherTargets,
      anchoredNear(random, answer, (v) => nearValues(target.domain, v), profile.distractors + 1),
      profile.distractors,
    );
    if (distractors === null) return null;

    return {
      prompt: msg('programming:codeMemory.crossReference.prompt', {
        type: schema.type,
        key: key.name,
        keyValue,
        field: target.name,
      }),
      content: {
        kind: 'cross-reference',
        records,
        ask: { keyField: key.name, keyValue, targetField: target.name, recordIndex },
      },
      response: singleChoice(random, answer, distractors),
      explanation: msg('programming:codeMemory.crossReference.explanation', {
        type: schema.type,
        key: key.name,
        keyValue,
        record: formatRecord(record),
        field: target.name,
        value: answer,
      }),
      skills: ['working-memory', 'logical-reasoning'],
    };
  });
}

// ── foreign-key-join ──────────────────────────────────────────────────────────────────────────────

/** A permutation of `count` parent rows where no child sits at the same position as its parent. */
function derangedParents(random: RandomGenerator, parentCount: number, count: number) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const rows = shuffle(
      random,
      Array.from({ length: parentCount }, (_, i) => i),
    ).slice(0, count);
    if (rows.every((row, i) => row !== i)) return rows;
  }
  return null;
}

/**
 * Two linked tables: find a parent by a field, follow the foreign key to its only child and recall
 * one of the child's fields. Children are deliberately not aligned with their parents, so the
 * relation has to be followed through the ids.
 */
export function foreignKeyJoin(random: RandomGenerator, profile: CodeMemoryProfile): MemoryDraft {
  if (profile.join === null) throw new Error(`Level ${profile.level} has no join configuration`);
  const { parentCount, childCount } = profile.join;
  const { similarity } = profile.records;
  return retryGeneration('foreign-key-join', () => {
    const relation = pick(random, RELATIONS);
    const parentSchema = schemaOf(relation.parent);
    const childSchema = schemaOf(relation.child);
    const parentSpecs = chooseFields(random, parentSchema, 3, isAskable);
    const childSpecs = chooseFields(random, childSchema, 3, isAskable);
    const parents = buildTable(random, parentSchema.type, parentSpecs, parentCount, similarity);
    const childRows = buildTable(random, childSchema.type, childSpecs, childCount, similarity);
    const links = derangedParents(random, parentCount, childCount);
    if (parents === null || childRows === null || links === null) return null;

    const parentIds = parents.map((parent) => fieldValue(parent, 'id') ?? '');
    const childIds = childRows.map((child) => fieldValue(child, 'id') ?? '');
    if (childIds.some((childId) => parentIds.includes(childId))) return null;
    // The foreign key goes right after the child's own id.
    const children: DataRecord[] = childRows.map((child, i) => {
      const [own, ...rest] = child.fields as [Field, ...Field[]];
      const link = { name: relation.foreignKey, value: parentIds[links[i] as number] ?? '' };
      return { type: child.type, fields: [own, link, ...rest] };
    });

    const childIndex = randomInt(random, 0, children.length - 1);
    const parentIndex = links[childIndex] as number;
    const parent = parents[parentIndex] as DataRecord;
    const child = children[childIndex] as DataRecord;
    const key = pick(
      random,
      parentSpecs.filter((spec) => spec.name !== 'id'),
    );
    const target = pick(random, childSpecs);
    const keyValue = fieldValue(parent, key.name) ?? '';
    const answer = fieldValue(child, target.name) ?? '';
    const parentId = parentIds[parentIndex] ?? '';

    const otherTargets = children
      .filter((_, i) => i !== childIndex)
      .map((other) => fieldValue(other, target.name) ?? '');
    // Confusing the child's id with the parent id it points to is the typical join slip.
    const lures = target.name === 'id' ? [...otherTargets, parentId] : otherTargets;
    const distractors = pickDistractors(
      random,
      answer,
      lures,
      anchoredNear(random, answer, (v) => nearValues(target.domain, v), profile.distractors + 1),
      profile.distractors,
    );
    if (distractors === null) return null;

    return {
      prompt: msg('programming:codeMemory.join.prompt', {
        parent: parent.type,
        key: key.name,
        keyValue,
        child: child.type,
        foreignKey: relation.foreignKey,
        field: target.name,
      }),
      content: {
        kind: 'foreign-key-join',
        parents,
        children,
        foreignKey: relation.foreignKey,
        ask: { keyField: key.name, keyValue, targetField: target.name, parentIndex, childIndex },
      },
      response: singleChoice(random, answer, distractors),
      explanation: msg('programming:codeMemory.join.explanation', {
        parent: parent.type,
        key: key.name,
        keyValue,
        parentId,
        child: child.type,
        link: `${relation.foreignKey}: ${parentId}`,
        record: formatRecord(child),
        field: target.name,
        value: answer,
      }),
      skills: ['working-memory', 'logical-reasoning', 'decomposition'],
    };
  });
}
