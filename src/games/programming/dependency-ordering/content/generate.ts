import { singleChoice, type ResponseOf } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import {
  pick,
  randomInt,
  sample,
  shuffle,
  weightedPick,
  type RandomGenerator,
} from '@/domain/random';
import type { DraftOf } from '../../shared/content';
import {
  brokenNeeds,
  countOrders,
  isValidOrder,
  needsOf,
  path,
  randomGraph,
  randomOrder,
  reaches,
  ready,
} from './graph';
import { THEMES } from './themes';
import type { DependencyChallenge, DependencyKind, DependencyProfile, Need } from './types';

type Draft = DraftOf<DependencyChallenge>;

const ITEM_IDS = 'abcdefghijklmnopqrstuvwxyz';
export const formatOrder = (order: readonly string[]) => order.join(' → ');
export const formatNeed = ([prerequisite, task]: Need) => `${task} needs ${prerequisite}`;

interface Setup {
  readonly theme: string;
  readonly tasks: string[];
  readonly needs: Need[];
}

function setup(random: RandomGenerator, profile: DependencyProfile, chain: boolean): Setup | null {
  const theme = pick(random, THEMES);
  const tasks = sample(random, theme.tasks, profile.taskCount).sort();
  const needs = randomGraph(random, tasks, profile.needCount, chain);
  return needs === null ? null : { theme: theme.name, tasks, needs };
}

const content = (kind: DependencyKind, s: Setup, done: readonly string[] = []) => ({
  kind,
  theme: s.theme,
  tasks: s.tasks,
  needs: s.needs,
  done,
});

function needsText(needs: readonly Need[], task: string): string {
  const list = needsOf(needs, task);
  return list.length === 0 ? `${task} needs nothing` : `${task} needs ${list.join(' and ')}`;
}

/** Exactly one task has no needs. */
function startFirst(random: RandomGenerator, profile: DependencyProfile): Draft | null {
  const s = setup(random, profile, false);
  if (s === null) return null;
  const sources = s.tasks.filter((t) => needsOf(s.needs, t).length === 0);
  if (sources.length !== 1) return null;
  const answer = sources[0] as string;
  const others = sample(
    random,
    s.tasks.filter((t) => t !== answer),
    Math.min(3, s.tasks.length - 1),
  );
  return {
    prompt: 'Which task can start first?',
    content: content('start-first', s),
    response: singleChoice(random, answer, others),
    explanation: `${answer} is the only task that needs nothing. The others must wait: ${others
      .map((t) => needsText(s.needs, t))
      .join('; ')}.`,
    skills: ['logical-reasoning', 'planning'],
  };
}

/** Some tasks are done (a valid beginning); exactly one of the options can start now. */
function readyNext(random: RandomGenerator, profile: DependencyProfile): Draft | null {
  const s = setup(random, profile, false);
  if (s === null) return null;
  const order = randomOrder(random, s.tasks, s.needs);
  const done = new Set(order.slice(0, randomInt(random, 2, Math.max(2, s.tasks.length - 4))));
  const now = ready(s.tasks, s.needs, done);
  const waiting = s.tasks.filter((t) => !done.has(t) && !now.includes(t));
  if (now.length === 0 || waiting.length < 3) return null;
  const answer = pick(random, now);
  const others = sample(random, waiting, 3);
  const missing = (t: string) =>
    needsOf(s.needs, t)
      .filter((p) => !done.has(p))
      .join(' and ');
  return {
    prompt: 'The ticked tasks are done. Which of these can start now?',
    content: content('ready-next', s, [...done].sort()),
    response: singleChoice(random, answer, others),
    explanation: `${needsText(s.needs, answer)}, and ${needsOf(s.needs, answer).length === 0 ? 'so it was free to start' : 'all of that is done'}. The others still wait: ${others
      .map((t) => `${t} needs ${missing(t)}`)
      .join('; ')}.`,
    skills: ['logical-reasoning', 'planning'],
  };
}

/** Exactly one valid order exists: put every task in it. */
function fullOrder(random: RandomGenerator, profile: DependencyProfile): Draft | null {
  const s = setup(random, profile, true);
  if (s === null || countOrders(s.tasks, s.needs) !== 1) return null;
  const order = randomOrder(random, s.tasks, s.needs);
  const shown = shuffle(random, s.tasks);
  if (shown.every((t, i) => t === order[i])) return null;
  const items = shown.map((label, i) => ({ id: ITEM_IDS.charAt(i), label }));
  const idOf = (task: string) => items.find((item) => item.label === task)?.id ?? '';
  const response: ResponseOf<'ordering'> = {
    format: 'ordering',
    question: { items },
    solution: { order: order.map(idOf) },
  };
  const steps = order.slice(1).map((t, i) => `${t} needs ${order[i] as string}`);
  return {
    prompt: 'There is only one order that respects every need. Put the tasks in that order.',
    content: content('full-order', s),
    response,
    explanation: `${order[0] as string} needs nothing, then each task needs the one before it: ${steps.join(', ')}. The extra needs (${s.needs
      .filter(([p, t]) => order.indexOf(t) - order.indexOf(p) > 1)
      .map(formatNeed)
      .join('; ')}) are already satisfied by that chain.`,
    skills: ['algorithmic-thinking', 'planning', 'sequential-thinking'],
  };
}

/**
 * Four orders that are all one swap away from the same hidden valid order; exactly one still
 * respects every need. No option sits at the centre of the others, so the needs must be checked.
 */
function validOrder(random: RandomGenerator, profile: DependencyProfile): Draft | null {
  const s = setup(random, profile, false);
  if (s === null || countOrders(s.tasks, s.needs) < 2) return null;
  const base = randomOrder(random, s.tasks, s.needs);
  const neighbours: string[][] = [];
  for (let i = 0; i < base.length; i++)
    for (let j = i + 1; j < base.length; j++) {
      if (profile.subtle && j !== i + 1) continue;
      const swapped = [...base];
      [swapped[i], swapped[j]] = [swapped[j] as string, swapped[i] as string];
      neighbours.push(swapped);
    }
  const valid = neighbours.filter((o) => isValidOrder(s.needs, o));
  const invalid = shuffle(
    random,
    neighbours.filter(
      (o) => !isValidOrder(s.needs, o) && (!profile.subtle || brokenNeeds(s.needs, o).length === 1),
    ),
  );
  if (valid.length === 0 || invalid.length < 3) return null;
  const answer = pick(random, valid);
  const wrong = invalid.slice(0, 3);
  return {
    prompt: 'Which order respects every need?',
    content: content('valid-order', s),
    response: singleChoice(random, formatOrder(answer), wrong.map(formatOrder)),
    explanation: `Only ${formatOrder(answer)} keeps every task after what it needs: ${wrong
      .map((o) => {
        const [p, t] = brokenNeeds(s.needs, o)[0] as Need;
        return `the order with ${t} before ${p} fails because ${t} needs ${p}`;
      })
      .join('; ')}.`,
    skills: ['logical-reasoning', 'error-detection'],
  };
}

/** Which new need would close a loop? Exactly one of four does. */
function cycle(random: RandomGenerator, profile: DependencyProfile): Draft | null {
  const s = setup(random, profile, false);
  if (s === null) return null;
  const pairs = s.tasks.flatMap((a) => s.tasks.filter((b) => b !== a).map((b): Need => [a, b]));
  const listed = (n: Need) => s.needs.some(([p, t]) => p === n[0] && t === n[1]);
  // "task needs prerequisite" closes a loop when prerequisite already (transitively) needs task.
  const closing = pairs.filter(([pre, task]) => {
    if (!reaches(s.needs, task, pre)) return false;
    return !profile.indirectCycles || !listed([task, pre]);
  });
  const harmless = pairs.filter(
    ([pre, task]) => !listed([pre, task]) && !reaches(s.needs, task, pre),
  );
  // Harmless options preferably repeat a need that is already implied: like the answer, they
  // join two tasks that are connected, so only the direction of the chain tells them apart.
  const implied = shuffle(
    random,
    harmless.filter(([pre, task]) => reaches(s.needs, pre, task)),
  );
  const unrelated = shuffle(
    random,
    harmless.filter(([pre, task]) => !reaches(s.needs, pre, task)),
  );
  if (closing.length === 0 || implied.length < 2) return null;
  const answer = pick(random, closing);
  const wrong = [...implied.slice(0, 3), ...unrelated].slice(0, 3);
  if (wrong.length < 3) return null;
  const loop = path(s.needs, answer[1], answer[0]) as string[];
  return {
    prompt: 'Which new need would create a cycle, so that no order could ever work?',
    content: content('cycle', s),
    response: singleChoice(random, formatNeed(answer), wrong.map(formatNeed)),
    explanation: `${loop.join(' → ')} already runs in that order (each one before the next). If ${answer[1]} also needed ${answer[0]}, it would have to come before itself. The other new needs keep at least one valid order.`,
    skills: ['logical-reasoning', 'debugging', 'abstraction'],
  };
}

const GENERATORS: Record<
  DependencyKind,
  (r: RandomGenerator, p: DependencyProfile) => Draft | null
> = {
  'start-first': startFirst,
  'ready-next': readyNext,
  'full-order': fullOrder,
  'valid-order': validOrder,
  cycle,
};

export function generateDependency(random: RandomGenerator, profile: DependencyProfile): Draft {
  const kind = weightedPick(random, profile.kinds);
  return retryGeneration(`dependency-ordering ${kind}`, () => GENERATORS[kind](random, profile));
}
