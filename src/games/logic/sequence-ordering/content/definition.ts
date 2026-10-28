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
import { gameIdOf } from '@/domain/shared';
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
  name: 'Sequence Ordering',
  tagline: 'Put everyone in the right order.',
  description:
    'Use clues such as “Ana finished ahead of Ben” or “exactly one person stands between them” to work out the full order. Higher levels add people and clues that only rule things out.',
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
    scoringSummary:
      'Exactly one order fits all the clues. An answer counts when every position is right. Your result is the share of puzzles ordered correctly; there is no time limit.',
    feedback: 'explain',
  },
  instructions: [
    'Read every clue. Exactly one order fits all of them.',
    'Start with clues that fix a position (“first”, “last”), then place the others around them.',
    'Use the arrow buttons to move names up or down, then submit your order.',
  ],
  simpleInstructions: 'Use the clues to put the names in order.',
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
      prompt:
        kind === 'race'
          ? 'Put the runners in finishing order, first at the top.'
          : 'Put the people in line order, front of the line at the top.',
      content: { kind, entities, clues, solution: target },
      response: orderingResponse(shown, target),
      explanation: `Only one order fits all ${clues.length} clues: ${target.join(', ')}. Check each clue against it; moving anyone breaks at least one clue.`,
      skills: ['sequential-thinking', 'logical-reasoning'],
    };
    return { ...identity, ...draft, timing: profile.timing };
  },
};
