import { locateResponse } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { msg } from '@/domain/shared';
import {
  chance,
  pick,
  randomInt,
  sample,
  shuffle,
  weightedPick,
  type RandomGenerator,
} from '@/domain/random';
import { codeRuleViolations, namesOf, readsOf } from '../solvers/codeRules';
import { explainViolation, findViolations } from '../solvers/violations';
import type {
  ArithOp,
  BugHunterProfile,
  CodeLine,
  CodeRule,
  CodeRuleType,
  Operand,
} from '../types';
import type { BugHunterDraft } from './draft';

/** Pairs of legal, confusingly similar names: near-misses for "assigned before read". */
const TWINS = [
  ['total', 'totals'],
  ['count', 'counter'],
  ['price', 'prices'],
  ['userId', 'userIds'],
  ['offset', 'offsets'],
  ['score', 'scores'],
] as const;

const NAMES = [
  'subtotal',
  'taxRate',
  'discount',
  'orderTotal',
  'itemCount',
  'pageSize',
  'limit',
  'attempts',
  'delayMs',
  'batchSize',
  'errorCount',
  'avgLatency',
  'maxRetries',
  'retryCount',
  'bonus',
  'fee',
  'balance',
  'width',
  'height',
  'area',
  'step',
  'page2',
  'retry3',
  'v2Total',
  'qty',
  'sum',
  'margin',
  'depth',
  'quota',
  'ratio',
  'tries',
  'cost',
  'rate',
  'amount',
  'budget',
  'weight',
  'speed',
  'minScore',
];

const RESOURCES = ['log', 'db', 'cache', 'socket', 'file', 'queue', 'report', 'stream'];
/** Resource names that never appear in an `open`: obvious write-while-open violations. */
const STRAY_RESOURCES = ['mailer', 'printer', 'backup'];

const ALL_RULES: readonly CodeRule[] = (
  ['defined-before-use', 'close-opened', 'write-while-open', 'camel-case'] as const
).map((type) => ({ type }));

type Step = 'const' | 'derive' | 'update' | 'print' | 'open' | 'write' | 'close';

/** Straight-line program of exactly `count` lines that satisfies every code rule. */
function buildProgram(random: RandomGenerator, count: number, twinPairs: number): CodeLine[] {
  const twins = sample(random, TWINS, twinPairs).flat();
  const names = [...twins, ...shuffle(random, NAMES)];
  const assigned: string[] = [];
  const unopened = shuffle(random, RESOURCES);
  const open: { resource: string; writes: number }[] = [];
  const lines: CodeLine[] = [];
  const operand = (): Operand =>
    chance(random, 0.7) ? pick(random, assigned) : randomInt(random, 2, 9);

  while (lines.length < count) {
    const remaining = count - lines.length;
    if (remaining <= open.length) {
      lines.push({ op: 'close', resource: (open.shift() as { resource: string }).resource });
      continue;
    }
    const fresh = names.length > 0;
    const step = weightedPick<Step>(random, {
      const: fresh ? (assigned.length < 2 ? 10 : 1) : 0,
      derive: fresh && assigned.length >= 2 ? 3 : 0,
      update: assigned.length >= 1 ? 1.2 : 0,
      print: assigned.length >= 1 ? 1 : 0,
      open: unopened.length > 0 && open.length < 2 && remaining > open.length + 3 ? 1.4 : 0,
      write: open.length > 0 && assigned.length >= 1 ? 2.5 : 0,
      close: open.some((o) => o.writes > 0) ? 1.2 : 0,
    });
    const op = pick<ArithOp>(random, ['+', '-', '*']);
    switch (step) {
      case 'const': {
        const target = names.shift() as string;
        lines.push({ op: 'set', target, expr: { left: randomInt(random, 0, 20), right: null } });
        assigned.push(target);
        break;
      }
      case 'derive': {
        const target = names.shift() as string;
        const left = pick(random, assigned);
        lines.push({ op: 'set', target, expr: { left, right: { op, value: operand() } } });
        assigned.push(target);
        break;
      }
      case 'update': {
        const target = pick(random, assigned);
        lines.push({ op: 'set', target, expr: { left: target, right: { op, value: operand() } } });
        break;
      }
      case 'print':
        lines.push({ op: 'print', value: pick(random, assigned) });
        break;
      case 'open': {
        const resource = unopened.shift() as string;
        lines.push({ op: 'open', resource });
        open.push({ resource, writes: 0 });
        break;
      }
      case 'write': {
        const block = pick(random, open);
        block.writes++;
        lines.push({ op: 'write', value: pick(random, assigned), resource: block.resource });
        break;
      }
      case 'close': {
        const block = pick(
          random,
          open.filter((o) => o.writes > 0),
        );
        open.splice(open.indexOf(block), 1);
        lines.push({ op: 'close', resource: block.resource });
        break;
      }
    }
  }
  return lines;
}

// ── Violations ────────────────────────────────────────────────────────────────────────────────────

type Subtlety = BugHunterProfile['violation'];

/** Replaces the `slot`-th variable a line reads with `name`. */
function withRead(line: CodeLine, slot: number, name: string): CodeLine {
  switch (line.op) {
    case 'set': {
      const { left, right } = line.expr;
      const leftIsRead = typeof left === 'string';
      if (leftIsRead && slot === 0) return { ...line, expr: { left: name, right } };
      return { ...line, expr: { left, right: right && { ...right, value: name } } };
    }
    case 'print':
    case 'write':
      return { ...line, value: name };
    case 'open':
    case 'close':
      return line;
  }
}

const allNames = (lines: readonly CodeLine[]) => new Set(lines.flatMap(namesOf));

const snake = (name: string) => name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const pascal = (name: string) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

/** Mutates one line so it breaks `rule`; returns the new program, or null if impossible here. */
function injectViolation(
  random: RandomGenerator,
  lines: readonly CodeLine[],
  rule: CodeRuleType,
  subtlety: Subtlety,
): { lines: CodeLine[]; target: number } | null {
  const used = allNames(lines);
  const replace = (index: number, line: CodeLine) => ({
    lines: lines.map((l, i) => (i === index ? line : l)),
    target: index,
  });
  const firstSet = (name: string) => lines.findIndex((l) => l.op === 'set' && l.target === name);

  switch (rule) {
    case 'defined-before-use': {
      const readers = [...lines.keys()].filter((i) => readsOf(lines[i] as CodeLine).length > 0);
      if (readers.length === 0) return null;
      const index = pick(random, readers);
      const line = lines[index] as CodeLine;
      const slot = randomInt(random, 0, readsOf(line).length - 1);
      const target = line.op === 'set' ? line.target : null;
      // Subtle: read a variable that is only set further down, or a plural twin that never is.
      const variables = lines.flatMap((l) => (l.op === 'set' ? [l.target] : []));
      const later = [...new Set(variables)].filter(
        (name) => firstSet(name) > index && name !== target,
      );
      const plurals = [...new Set(variables)]
        .filter((n) => !n.endsWith('s') && !used.has(`${n}s`))
        .map((n) => `${n}s`);
      const fresh = NAMES.filter((n) => !used.has(n));
      const pool = subtlety === 'subtle' ? (later.length > 0 ? later : plurals) : fresh;
      if (pool.length === 0) return null;
      return replace(index, withRead(line, slot, pick(random, pool)));
    }
    case 'camel-case': {
      // Only a name written exactly once can be renamed without breaking other lines.
      const counts = new Map<string, number>();
      for (const name of lines.flatMap(namesOf)) counts.set(name, (counts.get(name) ?? 0) + 1);
      const singles = [...lines.keys()].filter((i) => {
        const line = lines[i] as CodeLine;
        return line.op === 'set' && counts.get(line.target) === 1;
      });
      if (singles.length === 0) return null;
      const index = pick(random, singles);
      const line = lines[index] as Extract<CodeLine, { op: 'set' }>;
      const name = line.target;
      const bad =
        subtlety === 'obvious'
          ? snake(name).toUpperCase()
          : /[A-Z]/.test(name) && chance(random, 0.6)
            ? snake(name)
            : pascal(name);
      return used.has(bad) ? null : replace(index, { ...line, target: bad });
    }
    case 'close-opened': {
      const closes = [...lines.keys()].filter((i) => lines[i]?.op === 'close');
      if (closes.length === 0) return null;
      const index = pick(random, closes);
      const before = lines.slice(0, index).flatMap((l) => (l.op === 'set' ? [l.target] : []));
      if (before.length === 0) return null;
      const opened = (lines[index] as { resource: string }).resource;
      return {
        lines: lines.map((l, i) =>
          i === index ? { op: 'print', value: pick(random, before) } : l,
        ),
        target: lines.findIndex((l) => l.op === 'open' && l.resource === opened),
      };
    }
    case 'write-while-open': {
      const writes = [...lines.keys()].filter((i) => lines[i]?.op === 'write');
      if (writes.length === 0) return null;
      const index = pick(random, writes);
      const line = lines[index] as Extract<CodeLine, { op: 'write' }>;
      const openAt = new Set<string>();
      for (const l of lines.slice(0, index)) {
        if (l.op === 'open') openAt.add(l.resource);
        if (l.op === 'close') openAt.delete(l.resource);
      }
      // Subtle: a resource of this program that is closed already or not opened yet.
      const elsewhere = RESOURCES.filter((r) => used.has(r) && !openAt.has(r));
      const pool =
        subtlety === 'subtle' && elsewhere.length > 0
          ? elsewhere
          : STRAY_RESOURCES.filter((r) => !used.has(r));
      return replace(index, { ...line, resource: pick(random, pool) });
    }
  }
}

const needsResources = (rules: readonly CodeRuleType[]) =>
  rules.includes('close-opened') || rules.includes('write-while-open');

export function codeRule(random: RandomGenerator, profile: BugHunterProfile): BugHunterDraft {
  const count = profile.elementCount;
  // The broken rule is chosen first and uniformly, so every rule of the pool is broken equally often.
  const broken = pick(random, profile.codeRules);
  const types = shuffle(random, [
    broken,
    ...sample(
      random,
      profile.codeRules.filter((type) => type !== broken),
      Math.min(profile.decisionCount, profile.codeRules.length) - 1,
    ),
  ]);
  const rules: CodeRule[] = types.map((type) => ({ type }));
  const twinPairs = Math.min(TWINS.length, Math.ceil(profile.distractors / 3));

  const { content, violation } = retryGeneration('code-rule artifact', () => {
    const program = buildProgram(random, count, twinPairs);
    if (needsResources(types) && !program.some((l) => l.op === 'write')) return null;
    const injected = injectViolation(random, program, broken, profile.violation);
    if (injected === null) return null;
    // Gate on every code rule, stated or not: the artifact must hold no other bug of any kind.
    const unstated = ALL_RULES.filter((r) => !types.includes(r.type)).flatMap((r) =>
      codeRuleViolations(r, injected.lines),
    );
    const candidate = { kind: 'code-rule' as const, lines: injected.lines, rules };
    const found = findViolations(candidate);
    const only = found[0];
    if (unstated.length > 0 || found.length !== 1 || only?.index !== injected.target) return null;
    return { content: candidate, violation: only };
  });

  return {
    prompt: msg('programming:bugHunter.prompt.codeRule'),
    content,
    response: locateResponse(count, violation.index),
    explanation: explainViolation(violation, rules.length),
    skills: ['attention', 'debugging', 'logical-reasoning'],
  };
}
