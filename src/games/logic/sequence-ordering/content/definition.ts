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
import { gameIdOf, joinText, msg } from '@/domain/shared';
import { orderingResponse, PEOPLE, permutations, type Draft } from '@/games/logic/shared/content';
import { SEQUENCE_ORDERING_LEVELS } from './levels';
import { clueHolds } from './solver';
import type { OrderClue, OrderClueType, OrderingChallenge, OrderingProfile } from './types';

export const SEQUENCE_ORDERING_ID = gameIdOf('sequence-ordering');

function clueFor(
  random: RandomGenerator,
  type: OrderClueType,
  target: readonly string[],
): OrderClue | null {
  const n = target.length;
  const at = (i: number) => target[i] as string;
  const pair = () =>
    sample(random, [...target.keys()], 2).sort((x, y) => x - y) as [number, number];
  switch (type) {
    case 'before': {
      const [i, j] = pair();
      return { type, a: at(i), b: at(j) };
    }
    case 'right-before': {
      const i = randomInt(random, 0, n - 2);
      return { type, a: at(i), b: at(i + 1) };
    }
    case 'at': {
      const i = randomInt(random, 0, n - 1);
      return { type, a: at(i), position: i + 1 };
    }
    case 'not-at': {
      const i = randomInt(random, 0, n - 1);
      const p = pick(
        random,
        [...target.keys()].filter((k) => k !== i),
      );
      return { type, a: at(i), position: p + 1 };
    }
    case 'gap': {
      const [i, j] = pair();
      if (j - i < 2) return null;
      const [a, b] = shuffle(random, [at(i), at(j)]) as [string, string];
      return { type, a, b, between: j - i - 1 };
    }
    case 'next-to': {
      const i = randomInt(random, 0, n - 2);
      const [a, b] = shuffle(random, [at(i), at(i + 1)]) as [string, string];
      return { type, a, b };
    }
    case 'not-next-to': {
      const [i, j] = pair();
      if (j - i < 2) return null;
      const [a, b] = shuffle(random, [at(i), at(j)]) as [string, string];
      return { type, a, b };
    }
  }
}

/** Adds true clues until one order remains, then removes clues the others make redundant. */
function buildPuzzle(
  random: RandomGenerator,
  entities: readonly string[],
  profile: OrderingProfile,
) {
  const all = permutations(entities);
  const target = pick(random, all);
  let clues: OrderClue[] = [];
  let left = all;
  for (let i = 0; i < 80 && left.length > 1; i++) {
    const clue = clueFor(random, weightedPick(random, profile.clueTypes), target);
    if (!clue) continue;
    const next = left.filter((order) => clueHolds(clue, order));
    if (next.length < left.length) {
      clues.push(clue);
      left = next;
    }
  }
  if (left.length !== 1) return null;
  for (const clue of shuffle(random, clues)) {
    const without = clues.filter((c) => c !== clue);
    if (all.filter((order) => without.every((c) => clueHolds(c, order))).length === 1)
      clues = without;
  }
  return { target, clues: shuffle(random, clues) };
}

export const sequenceOrderingGame: GameDefinition<OrderingChallenge, OrderingProfile> = {
  id: SEQUENCE_ORDERING_ID,
  name: msg('logic:sequenceOrdering.name'),
  tagline: msg('logic:sequenceOrdering.tagline'),
  description: msg('logic:sequenceOrdering.description'),
  area: 'logic',
  skills: ['sequential-thinking', 'logical-reasoning', 'working-memory'],
  meta: {
    category: 'logic',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'ordering',
    estimatedMinutes: 5,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('logic:sequenceOrdering.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('logic:sequenceOrdering.instructions.1'),
    msg('logic:sequenceOrdering.instructions.2'),
    msg('logic:sequenceOrdering.instructions.3'),
  ],
  simpleInstructions: msg('logic:sequenceOrdering.simpleInstructions'),
  levels: SEQUENCE_ORDERING_LEVELS,
  generate({ identity, profile, random }) {
    const entities = sample(random, PEOPLE, profile.entities).sort();
    const { target, clues } = retryGeneration('ordering puzzle', () =>
      buildPuzzle(random, entities, profile),
    );
    const kind = chance(random, 0.5) ? 'race' : 'queue';
    let shown = shuffle(random, entities);
    while (shown.every((e, i) => e === target[i])) shown = shuffle(random, entities);
    const draft: Draft<OrderingChallenge> = {
      prompt: msg(`logic:sequenceOrdering.prompt.${kind}`),
      content: { kind, entities, clues, solution: target },
      response: orderingResponse(shown, target),
      explanation: msg('logic:sequenceOrdering.explanation', {
        count: clues.length,
        order: joinText(target, ', '),
      }),
      skills: ['sequential-thinking', 'logical-reasoning'],
    };
    return { ...identity, ...draft, timing: profile.timing };
  },
};
