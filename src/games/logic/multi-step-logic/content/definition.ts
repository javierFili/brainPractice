import { numericResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import {
  chance,
  pick,
  randomInt,
  sample,
  shuffle,
  weightedPick,
  type RandomGenerator,
} from '@/domain/random';
import { gameIdOf, joinText, msg, type Text } from '@/domain/shared';
import { listText, PEOPLE, textChoice, type Draft } from '@/games/logic/shared/content';
import { MULTI_STEP_LEVELS } from './levels';
import { compareOrders, comparisonPath, factHolds, solveNumbers } from './solver';
import { describeFact, describeQuestion, factSentence } from './text';
import type {
  Comparison,
  Fact,
  MultiStepChallenge,
  MultiStepContent,
  MultiStepProfile,
  Question,
  Theme,
} from './types';

export const MULTI_STEP_LOGIC_ID = gameIdOf('multi-step-logic');

type NumbersContent = Extract<MultiStepContent, { kind: 'numbers' }>;

/**
 * Hidden values linked in a tree (each person after the first is related to an earlier one), so
 * the solver can prune person by person; then an anchor (a known value or a total) and a question.
 */
function buildNumbers(random: RandomGenerator, profile: MultiStepProfile) {
  const n = profile.people;
  const max = profile.maxValue;
  const values = [randomInt(random, 2, Math.floor(max / 2))];
  const facts: Fact[] = [];
  for (let i = 1; i < n; i++) {
    const j = randomInt(random, 0, i - 1);
    const vj = values[j] as number;
    const relation = pick(random, profile.relations);
    let fact: Fact;
    let vi: number;
    if (relation === 'times') {
      const k = pick(random, [2, 3]);
      const up = chance(random, 0.5);
      if (!up && vj % k !== 0) return null;
      vi = up ? vj * k : vj / k;
      fact = up
        ? { type: 'times', a: i, b: j, k, flip: chance(random, 0.4) }
        : { type: 'times', a: j, b: i, k, flip: chance(random, 0.4) };
    } else {
      const k = randomInt(random, 1, 9);
      const up = chance(random, 0.5);
      vi = up ? vj + k : vj - k;
      fact = up
        ? { type: 'diff', a: i, b: j, k, flip: chance(random, 0.4) }
        : { type: 'diff', a: j, b: i, k, flip: chance(random, 0.4) };
    }
    if (vi < 1 || vi > max || values.includes(vi)) return null;
    values.push(vi);
    facts.push(fact);
  }
  const qType = pick(random, profile.questions);
  const anchor =
    qType === 'most' || qType === 'least'
      ? pick(random, profile.anchors)
      : pick(
          random,
          profile.anchors.filter((a) => a !== 'none'),
        );
  let anchored = -1;
  if (anchor === 'value') {
    anchored = randomInt(random, 0, n - 1);
    facts.push({ type: 'value', a: anchored, v: values[anchored] as number });
  } else if (anchor === 'sum') {
    const people =
      n <= 3
        ? [...Array(n).keys()]
        : sample(random, [...Array(n).keys()], randomInt(random, 2, n)).sort((a, b) => a - b);
    facts.push({
      type: 'sum',
      people,
      total: people.reduce((s, p) => s + (values[p] as number), 0),
    });
  }
  const others = [...Array(n).keys()].filter((i) => i !== anchored);
  let question: Question;
  if (qType === 'value') question = { type: 'value', a: pick(random, others) };
  else if (qType === 'difference') {
    const direct = new Set(
      facts.flatMap((f) => (f.type === 'diff' ? [`${f.a}:${f.b}`, `${f.b}:${f.a}`] : [])),
    );
    const pairs = [...Array(n).keys()]
      .flatMap((a) => [...Array(n).keys()].map((b) => [a, b] as const))
      .filter(
        ([a, b]) => (values[a] as number) > (values[b] as number) && !direct.has(`${a}:${b}`),
      );
    if (pairs.length === 0) return null;
    const [a, b] = pick(random, pairs);
    question = { type: 'difference', a, b };
  } else question = { type: qType };
  const result = solveNumbers(n, facts, question, max);
  if (result.answers.size !== 1) return null;
  const answer = [...result.answers][0] as number;
  if (answer < 0) return null;
  if (!facts.every((f) => factHolds(f, values))) throw new Error('Generated a false fact');
  return { values, facts, question, answer };
}

const key = (path: string) => `logic:multiStepLogic.${path}`;

/** Step-by-step working when one value is known; otherwise the unique solution with checks. */
function explainNumbers(content: NumbersContent, answerText: Text): Text {
  const { facts, names, theme, solution } = content;
  const known = new Set<number>();
  const lines: Text[] = [];
  const anchor = facts.find((f): f is Extract<Fact, { type: 'value' }> => f.type === 'value');
  if (anchor) {
    known.add(anchor.a);
    lines.push(factSentence(anchor, theme, names));
    for (let progress = true; progress;) {
      progress = false;
      for (const f of facts) {
        if (f.type !== 'diff' && f.type !== 'times') continue;
        const target =
          known.has(f.a) && !known.has(f.b) ? f.b : known.has(f.b) && !known.has(f.a) ? f.a : -1;
        if (target === -1) continue;
        known.add(target);
        progress = true;
        lines.push(
          msg(key(`explanation.step.${theme}`), {
            fact: describeFact(f, theme, names),
            name: names[target] as string,
            count: solution[target] as number,
          }),
        );
      }
    }
    return msg(key('explanation.chain'), { lines: joinText(lines, ' '), answer: answerText });
  }
  const table = names.map((name, i) =>
    msg(key(`explanation.entry.${theme}`), { name, count: solution[i] as number }),
  );
  const hasTotal = facts.some((f) => f.type === 'sum');
  return msg(key(`explanation.${hasTotal ? 'total' : 'free'}`), {
    table: listText(table),
    answer: answerText,
  });
}

function numbersDraft(
  random: RandomGenerator,
  profile: MultiStepProfile,
): Draft<MultiStepChallenge> {
  const { values, facts, question, answer } = retryGeneration('multi-step numbers', () =>
    buildNumbers(random, profile),
  );
  const theme: Theme = chance(random, 0.5) ? 'ages' : 'marbles';
  const names = sample(random, PEOPLE, profile.people);
  const content: NumbersContent = {
    kind: 'numbers',
    theme,
    names,
    facts: shuffle(random, facts),
    question,
    solution: values,
  };
  const choice = question.type === 'most' || question.type === 'least';
  const answerText = choice ? (names[answer] as string) : String(answer);
  return {
    prompt: describeQuestion(question, theme, names),
    content,
    response: choice
      ? textChoice(
          random,
          answerText,
          names.filter((n) => n !== answerText),
        )
      : {
          ...numericResponse(answer),
          question: { unit: msg(key(`units.${theme === 'marbles' ? 'marbles' : 'years'}`)) },
        },
    explanation: explainNumbers(content, answerText),
    skills: ['logical-reasoning', 'working-memory', 'decomposition'],
  };
}

function compareDraft(
  random: RandomGenerator,
  profile: MultiStepProfile,
): Draft<MultiStepChallenge> {
  const n = profile.people;
  const question: 'most' | 'least' = chance(random, 0.5) ? 'most' : 'least';
  const { rank, comparisons, answer } = retryGeneration('comparison puzzle', () => {
    const rank = shuffle(random, [...Array(n).keys()]);
    const pairs = shuffle(
      random,
      [...Array(n).keys()].flatMap((a) =>
        [...Array(n).keys()]
          .filter((b) => (rank[a] as number) > (rank[b] as number))
          .map((b) => ({ a, b })),
      ),
    );
    const top = rank.indexOf(question === 'most' ? n - 1 : 0);
    const decided = (cs: readonly Comparison[]) => {
      const orders = compareOrders(n, cs);
      const tops = new Set(orders.map((r) => r.indexOf(question === 'most' ? n - 1 : 0)));
      return tops.size === 1;
    };
    // Prefer comparisons that do not involve the answer directly being compared with everyone.
    let comparisons: Comparison[] = [];
    for (const pair of pairs) {
      if (decided(comparisons)) break;
      comparisons.push(pair);
    }
    for (const c of shuffle(random, comparisons)) {
      const without = comparisons.filter((x) => x !== c);
      if (decided(without)) comparisons = without;
    }
    // At least one person must be reached through a chain, not a direct comparison.
    const direct = comparisons.filter((c) =>
      question === 'most' ? c.a === top : c.b === top,
    ).length;
    if (direct >= n - 1) return null;
    return { rank, comparisons: shuffle(random, comparisons), answer: top };
  });
  const names = sample(random, PEOPLE, n);
  const chains = [...Array(n).keys()]
    .filter((p) => p !== answer)
    .map((p) => {
      const path =
        question === 'most'
          ? comparisonPath(comparisons, answer, p)
          : comparisonPath(comparisons, p, answer);
      return (path ?? []).map((i) => names[i] as string).join(' > ');
    });
  const answerName = names[answer] as string;
  return {
    prompt: msg(key(`compare.${question === 'most' ? 'tallest' : 'shortest'}`)),
    content: { kind: 'compare', names, comparisons, question, solution: rank },
    response: textChoice(
      random,
      answerName,
      names.filter((x) => x !== answerName),
    ),
    explanation: msg(key(`compare.explanation.${question}`), {
      chains: joinText(chains, '; '),
      name: answerName,
    }),
    skills: ['logical-reasoning', 'sequential-thinking'],
  };
}

export const multiStepLogicGame: GameDefinition<MultiStepChallenge, MultiStepProfile> = {
  id: MULTI_STEP_LOGIC_ID,
  name: msg('logic:multiStepLogic.name'),
  tagline: msg('logic:multiStepLogic.tagline'),
  description: msg('logic:multiStepLogic.description'),
  area: 'logic',
  skills: ['logical-reasoning', 'working-memory', 'decomposition', 'problem-solving'],
  meta: {
    category: 'logic',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'mixed',
    estimatedMinutes: 5,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('logic:multiStepLogic.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('logic:multiStepLogic.instructions.1'),
    msg('logic:multiStepLogic.instructions.2'),
    msg('logic:multiStepLogic.instructions.3'),
    msg('logic:multiStepLogic.instructions.4'),
  ],
  simpleInstructions: msg('logic:multiStepLogic.simpleInstructions'),
  levels: MULTI_STEP_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    const draft =
      kind === 'compare' ? compareDraft(random, profile) : numbersDraft(random, profile);
    return { ...identity, ...draft, timing: profile.timing };
  },
};
