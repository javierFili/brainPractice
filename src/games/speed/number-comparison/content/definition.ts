import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, weightedPick } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { SPEED_SCORING } from '@/games/speed/shared/content';
import { NUMBER_COMPARISON_LEVELS } from './levels';
import { compareQuantities, decimals, expressions, fractions, integers } from './quantities';
import type {
  NumberComparisonChallenge,
  NumberComparisonProfile,
  NumberKind,
  Quantity,
} from './types';

const BUILDERS = { integers, decimals, fractions, expressions } as const;

/** The unique extreme of `items`, or null on a tie. */
export function extremeOf(items: readonly Quantity[], ask: 'largest' | 'smallest') {
  const sign = ask === 'largest' ? 1 : -1;
  const sorted = [...items].sort((a, b) => sign * compareQuantities(b, a));
  const [first, second] = sorted;
  if (first === undefined || second === undefined || compareQuantities(first, second) === 0)
    return null;
  return first;
}

const KIND_WORD: Record<NumberKind, string> = {
  integers: 'number',
  decimals: 'decimal',
  fractions: 'fraction',
  expressions: 'result',
};

export const NUMBER_COMPARISON_ID = gameIdOf('number-comparison');

export const numberComparisonGame: GameDefinition<
  NumberComparisonChallenge,
  NumberComparisonProfile
> = {
  id: NUMBER_COMPARISON_ID,
  name: 'Number Comparison',
  tagline: 'Which one is bigger? Quick!',
  description:
    'Pick the largest (or smallest) value as fast as you can. The numbers get closer together, more of them appear, and later they come as decimals, fractions and small calculations.',
  area: 'speed',
  skills: ['processing-speed', 'mental-agility', 'selective-attention'],
  meta: {
    category: 'speed',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 2,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time'],
    scoringSummary:
      'Each pick is right or wrong; a wrong pick costs points. A correct pick earns more the faster it comes, but accuracy carries most of the result. Relaxed timing removes the time limit.',
    feedback: 'brief',
  },
  instructions: [
    'Read the question: largest or smallest.',
    'Pick that value with a click or its number key (1–4).',
    'Decimals: compare digit by digit after the point — 0.5 is larger than 0.45.',
    'Fractions and calculations: work out the value before comparing.',
  ],
  simpleInstructions: 'Pick the biggest number, fast.',
  levels: NUMBER_COMPARISON_LEVELS,
  scoring: SPEED_SCORING,
  generate({ identity, profile, random }) {
    return retryGeneration('a number comparison', () => {
      const kind = weightedPick(random, profile.kinds);
      const ask = chance(random, profile.smallestShare) ? 'smallest' : 'largest';
      const items = BUILDERS[kind](random, profile.optionCount, profile);
      if (items === null) return null;
      const answer = extremeOf(items, ask);
      if (answer === null || new Set(items.map((q) => q.label)).size !== items.length) return null;
      return {
        ...identity,
        prompt: `Which ${KIND_WORD[kind]} is the ${ask}?`,
        content: { kind, ask, items },
        response: singleChoice(
          random,
          answer.label,
          items.filter((q) => q !== answer).map((q) => q.label),
        ),
        explanation:
          kind === 'expressions'
            ? `${answer.label} = ${answer.num / answer.den}, the ${ask} result.`
            : `${answer.label} is the ${ask}.`,
        skills: kind === 'integers' ? ['processing-speed'] : ['processing-speed', 'mental-agility'],
        timing: profile.timing,
      };
    });
  },
};
