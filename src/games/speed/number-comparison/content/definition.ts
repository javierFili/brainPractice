import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, weightedPick } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
import { SPEED_SCORING } from '@/games/speed/shared/content';
import { NUMBER_COMPARISON_LEVELS } from './levels';
import { compareQuantities, decimals, expressions, fractions, integers } from './quantities';
import type { NumberComparisonChallenge, NumberComparisonProfile, Quantity } from './types';

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

export const NUMBER_COMPARISON_ID = gameIdOf('number-comparison');

export const numberComparisonGame: GameDefinition<
  NumberComparisonChallenge,
  NumberComparisonProfile
> = {
  id: NUMBER_COMPARISON_ID,
  name: msg('speed:numberComparison.name'),
  tagline: msg('speed:numberComparison.tagline'),
  description: msg('speed:numberComparison.description'),
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
    scoringSummary: msg('speed:numberComparison.scoringSummary'),
    feedback: 'brief',
  },
  instructions: [
    msg('speed:numberComparison.instructions.question'),
    msg('speed:numberComparison.instructions.pick'),
    msg('speed:numberComparison.instructions.decimals'),
    msg('speed:numberComparison.instructions.fractions'),
  ],
  simpleInstructions: msg('speed:numberComparison.simpleInstructions'),
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
        prompt: msg(`speed:numberComparison.prompt.${kind}.${ask}`),
        content: { kind, ask, items },
        response: singleChoice(
          random,
          answer.label,
          items.filter((q) => q !== answer).map((q) => q.label),
        ),
        explanation:
          kind === 'expressions'
            ? msg(`speed:numberComparison.explanation.expression.${ask}`, {
                expression: answer.label,
                value: String(answer.num / answer.den),
              })
            : msg(`speed:numberComparison.explanation.value.${ask}`, { value: answer.label }),
        skills: kind === 'integers' ? ['processing-speed'] : ['processing-speed', 'mental-agility'],
        timing: profile.timing,
      };
    });
  },
};
