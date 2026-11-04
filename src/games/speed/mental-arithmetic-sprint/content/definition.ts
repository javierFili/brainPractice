import { numericResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { chance, pick, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
import { SPEED_SCORING, fixedChoice } from '@/games/speed/shared/content';
import { buildExpression, type Expression } from './expressions';
import { ARITHMETIC_LEVELS } from './levels';
import type { ArithmeticChallenge, ArithmeticProfile } from './types';

export const VERDICTS = [
  msg('speed:mentalArithmeticSprint.true'),
  msg('speed:mentalArithmeticSprint.false'),
] as const;

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
  name: msg('speed:mentalArithmeticSprint.name'),
  tagline: msg('speed:mentalArithmeticSprint.tagline'),
  description: msg('speed:mentalArithmeticSprint.description'),
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
    scoringSummary: msg('speed:mentalArithmeticSprint.scoringSummary'),
    feedback: 'brief',
  },
  instructions: [
    msg('speed:mentalArithmeticSprint.instructions.verify'),
    msg('speed:mentalArithmeticSprint.instructions.solve'),
    msg('speed:mentalArithmeticSprint.instructions.precedence'),
    msg('speed:mentalArithmeticSprint.instructions.time'),
  ],
  simpleInstructions: msg('speed:mentalArithmeticSprint.simpleInstructions'),
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
        prompt: msg('speed:mentalArithmeticSprint.prompt.solve'),
        content: { kind, family, expression: text, value, shown: null },
        response: numericResponse(value),
        explanation: msg('speed:mentalArithmeticSprint.explanation.solve', {
          expression: text,
          value: String(value),
        }),
        skills: ['processing-speed', 'working-memory'],
        timing: profile.timing,
      };
    }
    const isTrue = chance(random, 0.5);
    const shown = isTrue ? value : wrongResult(random, expression);
    return {
      ...identity,
      prompt: msg('speed:mentalArithmeticSprint.prompt.verify'),
      content: { kind, family, expression: text, value, shown },
      response: fixedChoice(VERDICTS, isTrue ? 0 : 1),
      explanation: isTrue
        ? msg('speed:mentalArithmeticSprint.explanation.true', {
            expression: text,
            value: String(value),
          })
        : msg('speed:mentalArithmeticSprint.explanation.false', {
            expression: text,
            value: String(value),
            shown: String(shown),
          }),
      skills: ['processing-speed', 'mental-agility'],
      timing: profile.timing,
    };
  },
};
