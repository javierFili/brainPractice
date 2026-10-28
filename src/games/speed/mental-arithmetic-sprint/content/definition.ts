import { numericResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { chance, pick, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { SPEED_SCORING, fixedChoice } from '@/games/speed/shared/content';
import { buildExpression, type Expression } from './expressions';
import { ARITHMETIC_LEVELS } from './levels';
import type { ArithmeticChallenge, ArithmeticProfile } from './types';

export const VERDICTS = ['True', 'False'] as const;

/** A plausible wrong result: a typical slip when there is one, otherwise a near miss. */
function wrongResult(random: RandomGenerator, { value, slips }: Expression): number {
  const near = [1, -1, 2, -2, ...(value >= 20 ? [10, -10] : [])].map((d) => value + d);
  const slip = slips.filter((s) => s !== value && s >= 0);
  const candidates = (slip.length > 0 && chance(random, 0.5) ? slip : near).filter(
    (s) => s !== value && s >= 0,
  );
  return pick(random, candidates);
}

export const MENTAL_ARITHMETIC_SPRINT_ID = gameIdOf('mental-arithmetic-sprint');

export const mentalArithmeticSprintGame: GameDefinition<ArithmeticChallenge, ArithmeticProfile> = {
  id: MENTAL_ARITHMETIC_SPRINT_ID,
  name: 'Mental Arithmetic Sprint',
  tagline: 'Quick sums, checked or solved.',
  description:
    'Short calculations against the clock. First decide whether an equation is true or false, then type results yourself — from one-digit sums to two-digit products and three-number expressions.',
  area: 'speed',
  skills: ['processing-speed', 'working-memory', 'mental-agility'],
  meta: {
    category: 'speed',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'mixed',
    estimatedMinutes: 3,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time'],
    scoringSummary:
      'Each calculation is right or wrong; a wrong answer costs points. A correct answer earns more the faster it comes, but accuracy carries most of the result. Relaxed timing removes the time limit, and the task still works the same.',
    feedback: 'brief',
  },
  instructions: [
    'True or false: press 1 if the equation is right, 2 if it is wrong.',
    'Type the answer: enter the missing result and press Enter.',
    'Multiply and divide before adding and subtracting, unless brackets say otherwise.',
    'Answer before the time runs out — accuracy counts more than speed.',
  ],
  simpleInstructions: 'Is the sum right? Or type the answer — as fast as you can.',
  levels: ARITHMETIC_LEVELS,
  scoring: SPEED_SCORING,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    const family = pick(random, profile.families);
    const expression = buildExpression(random, family);
    const { text, value } = expression;
    if (kind === 'solve') {
      return {
        ...identity,
        prompt: 'Type the result.',
        content: { kind, family, expression: text, value, shown: null },
        response: numericResponse(value),
        explanation: `${text} = ${value}.`,
        skills: ['processing-speed', 'working-memory'],
        timing: profile.timing,
      };
    }
    const isTrue = chance(random, 0.5);
    const shown = isTrue ? value : wrongResult(random, expression);
    return {
      ...identity,
      prompt: 'True or false?',
      content: { kind, family, expression: text, value, shown },
      response: fixedChoice(VERDICTS, isTrue ? 0 : 1),
      explanation: isTrue
        ? `True: ${text} = ${value}.`
        : `False: ${text} = ${value}, not ${shown}.`,
      skills: ['processing-speed', 'mental-agility'],
      timing: profile.timing,
    };
  },
};
