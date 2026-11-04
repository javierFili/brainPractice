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
import { joinText, msg, type Text } from '@/domain/shared';
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
import { quotedTask, taskLabel, THEMES } from './themes';
import type { DependencyChallenge, DependencyKind, DependencyProfile, Need } from './types';

type Draft = DraftOf<DependencyChallenge>;

const ITEM_IDS = 'abcdefghijklmnopqrstuvwxyz';
export const formatOrder = (order: readonly string[]) => order.join(' → ');
export const formatNeed = ([prerequisite, task]: Need) => `${task} needs ${prerequisite}`;

/** What people read for an order and a need (`formatOrder` / `formatNeed` stay as option ids). */
const orderText = (order: readonly string[]): Text => joinText(order.map(taskLabel), ' → ');
const needText = ([prerequisite, task]: Need): Text =>
  msg('programming:dependencyOrdering.need', {
    task: quotedTask(task),
    prerequisite: quotedTask(prerequisite),
  });

/** Single choice over ids (tasks, orders, needs), each option shown with its own text. */
function choiceOf(
  random: RandomGenerator,
  correct: string,
  distractors: readonly string[],
  text: (id: string) => Text,
): ResponseOf<'single-choice'> {
  const response = singleChoice(random, correct, distractors);
  return {
    ...response,
    question: {
      options: response.question.options.map((o) => ({ ...o, label: text(o.label as string) })),
    },
  };
}

/** "a and b" in the reader's language, each task quoted. */
const taskList = (tasks: readonly string[]): Text => joinText(tasks.map(quotedTask));

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

function needsText(needs: readonly Need[], task: string): Text {
  const list = needsOf(needs, task);
  return list.length === 0
    ? msg('programming:dependencyOrdering.needsNothing', { task: quotedTask(task) })
    : msg('programming:dependencyOrdering.need', {
        task: quotedTask(task),
        prerequisite: taskList(list),
      });
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
    prompt: msg('programming:dependencyOrdering.prompt.startFirst'),
    content: content('start-first', s),
    response: choiceOf(random, answer, others, taskLabel),
    explanation: msg('programming:dependencyOrdering.explanation.startFirst', {
      task: quotedTask(answer),
      others: joinText(
        others.map((t) => needsText(s.needs, t)),
        '; ',
      ),
    }),
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
  const missing = (t: string) => taskList(needsOf(s.needs, t).filter((p) => !done.has(p)));
  return {
    prompt: msg('programming:dependencyOrdering.prompt.readyNext'),
    content: content('ready-next', s, [...done].sort()),
    response: choiceOf(random, answer, others, taskLabel),
    explanation: msg(
      needsOf(s.needs, answer).length === 0
        ? 'programming:dependencyOrdering.explanation.readyNextFree'
        : 'programming:dependencyOrdering.explanation.readyNextDone',
      {
        needs: needsText(s.needs, answer),
        others: joinText(
          others.map((t) =>
            msg('programming:dependencyOrdering.need', {
              task: quotedTask(t),
              prerequisite: missing(t),
            }),
          ),
          '; ',
        ),
      },
    ),
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
  const items = shown.map((task, i) => ({ id: ITEM_IDS.charAt(i), label: taskLabel(task) }));
  const idOf = (task: string) => ITEM_IDS.charAt(shown.indexOf(task));
  const response: ResponseOf<'ordering'> = {
    format: 'ordering',
    question: { items },
    solution: { order: order.map(idOf) },
  };
  const steps = order.slice(1).map((t, i) => needText([order[i] as string, t]));
  const extra = s.needs.filter(([p, t]) => order.indexOf(t) - order.indexOf(p) > 1);
  return {
    prompt: msg('programming:dependencyOrdering.prompt.fullOrder'),
    content: content('full-order', s),
    response,
    explanation: msg(
      extra.length === 0
        ? 'programming:dependencyOrdering.explanation.fullOrder'
        : 'programming:dependencyOrdering.explanation.fullOrderExtra',
      {
        first: quotedTask(order[0] as string),
        steps: joinText(steps, ', '),
        extra: joinText(extra.map(needText), '; '),
      },
    ),
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
    prompt: msg('programming:dependencyOrdering.prompt.validOrder'),
    content: content('valid-order', s),
    response: choiceOf(random, formatOrder(answer), wrong.map(formatOrder), (id) =>
      orderText(id.split(' → ')),
    ),
    explanation: msg('programming:dependencyOrdering.explanation.validOrder', {
      order: orderText(answer),
      others: joinText(
        wrong.map((o) => {
          const [p, t] = brokenNeeds(s.needs, o)[0] as Need;
          return msg('programming:dependencyOrdering.explanation.brokenOrder', {
            task: quotedTask(t),
            prerequisite: quotedTask(p),
          });
        }),
        '; ',
      ),
    }),
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
    prompt: msg('programming:dependencyOrdering.prompt.cycle'),
    content: content('cycle', s),
    response: choiceOf(random, formatNeed(answer), wrong.map(formatNeed), (id) => {
      const [task, prerequisite] = id.split(' needs ') as [string, string];
      return needText([prerequisite, task]);
    }),
    explanation: msg('programming:dependencyOrdering.explanation.cycle', {
      loop: orderText(loop),
      task: quotedTask(answer[1]),
      prerequisite: quotedTask(answer[0]),
    }),
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
