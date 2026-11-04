import { singleChoice } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { chance, pick, randomInt, type RandomGenerator } from '@/domain/random';
import {
  buildSequence,
  describeSequenceRule,
  determinedNext,
  nextTerm,
} from '../solvers/sequences';
import { msg } from '@/domain/shared';
import type { PatternProfile, SequenceFamily, SequenceRule } from '../types';
import { pickDistractors, type PatternDraft } from './draft';

/** Small numbers only: difficulty must come from the rule, not from arithmetic. */
const MAX_TERM = 250;

/** Random integer in [min, max] other than 0 and other than every value in `avoid`. */
const nonZero = (
  random: RandomGenerator,
  min: number,
  max: number,
  avoid: readonly number[] = [],
) =>
  pick(
    random,
    Array.from({ length: max - min + 1 }, (_, i) => min + i).filter(
      (n) => n !== 0 && !avoid.includes(n),
    ),
  );

function randomRule(
  random: RandomGenerator,
  family: SequenceFamily,
): { rule: SequenceRule; start: number[] } {
  const start = [randomInt(random, 1, 15), randomInt(random, 1, 15)];
  switch (family) {
    case 'constant-step': {
      const step = nonZero(random, -4, 9);
      return {
        rule: { family, step: Math.abs(step) === 1 ? step * 2 : step },
        start: [step < 0 ? randomInt(random, 30, 50) : randomInt(random, 1, 20)],
      };
    }
    case 'alternating-steps': {
      const first = randomInt(random, 2, 8);
      return { rule: { family, steps: [first, nonZero(random, -6, 8, [first])] }, start };
    }
    case 'growing-step': {
      const growth = pick(random, [-2, -1, 1, 1, 2, 3]);
      const firstStep = growth < 0 ? randomInt(random, 8, 12) : randomInt(random, 1, 4);
      return { rule: { family, firstStep, growth }, start };
    }
    case 'multiply':
      return { rule: { family, factor: pick(random, [2, 3]) }, start: [randomInt(random, 1, 5)] };
    case 'interleaved': {
      const first = randomInt(random, 2, 6);
      return { rule: { family, steps: [first, nonZero(random, -4, 6, [first])] }, start };
    }
    case 'step-cycle': {
      const a = nonZero(random, -4, 7);
      const b = nonZero(random, -4, 7, [a]);
      return { rule: { family, steps: [a, b, nonZero(random, -4, 7, [a])] }, start };
    }
    case 'multiply-add':
      return {
        rule: { family, factor: 2, add: nonZero(random, -3, 3) },
        start: [randomInt(random, 1, 6)],
      };
    case 'sum-of-previous-two':
      return { rule: { family }, start: [randomInt(random, 1, 5), randomInt(random, 1, 6)] };
    case 'alternating-ops':
      return {
        rule: {
          family,
          factor: pick(random, [2, 3]),
          add: randomInt(random, 1, 6),
          multiplyFirst: chance(random, 0.5),
        },
        start: [randomInt(random, 1, 6)],
      };
  }
}

/** Continuations produced by plausible but wrong readings of the sequence, most tempting first. */
function misreadings(terms: readonly number[], rule: SequenceRule, answer: number): number[] {
  const at = (k: number) => terms[terms.length - k] as number;
  const [last, prev, before, fourth] = [at(1), at(2), at(3), at(4)];
  const lastStep = last - prev;
  const ratio = prev !== 0 && last % prev === 0 ? last * (last / prev) : null;
  return [
    last + lastStep, // only the last step, repeated
    last + lastStep + (lastStep - (prev - before)), // the change of the step, extrapolated
    last + (prev - before), // steps alternating in pairs
    last + (last - before), // continuing the wrong one of two interleaved sequences
    last + (before - fourth), // steps repeating in threes
    last + lastStep + 1, // step assumed to grow by one
    last + prev, // sum of the last two
    ...(ratio === null ? [] : [ratio]), // constant ratio
    nextTerm(rule, [...terms, answer]), // one term too far
    last + lastStep - 1,
  ].filter((n) => Number.isInteger(n) && n >= 0);
}

export function numberSequence(random: RandomGenerator, profile: PatternProfile): PatternDraft {
  const { families, sequenceLength } = profile.sequence;
  return retryGeneration('number sequence', () => {
    const { rule, start } = randomRule(random, pick(random, families));
    const terms = buildSequence(rule, start, sequenceLength);
    const answer = nextTerm(rule, terms);
    if ([...terms, answer].some((t) => t < 0 || t > MAX_TERM)) return null;
    // A term repeating its predecessor reads as a stall, not as a rule.
    if ([...terms, answer].some((t, i, all) => i > 0 && t === all[i - 1])) return null;
    // Every catalogue rule that fits the shown terms must continue it the same way.
    if (determinedNext(terms) !== answer) return null;
    const wrong = pickDistractors(
      String(answer),
      misreadings(terms, rule, answer).map(String),
      profile.distractors,
    );
    if (wrong === null) return null;
    const last = terms.at(-1) as number;
    const repeated = last + (last - (terms.at(-2) as number));
    const trap = wrong.includes(String(repeated));
    const values = {
      rule: describeSequenceRule(rule),
      last: String(last),
      answer: String(answer),
      repeated: String(repeated),
    };
    return {
      prompt: msg('programming:patternArchitect.sequence.prompt'),
      content: { kind: 'number-sequence', terms },
      response: singleChoice(random, String(answer), wrong),
      explanation: msg(
        `programming:patternArchitect.sequence.${trap ? 'explanationTrap' : 'explanation'}`,
        values,
      ),
      skills: ['pattern-recognition', 'abstraction'],
    };
  });
}
