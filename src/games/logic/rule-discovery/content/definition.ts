import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, sample, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { glyphKey, glyphLabel, type Glyph } from '@/games/kit/content';
import { capitalize, listJoin, type Draft } from '@/games/logic/shared/content';
import { RULE_DISCOVERY_LEVELS } from './levels';
import {
  describeRule,
  glyphFits,
  glyphRules,
  GLYPHS,
  numberFits,
  numberRules,
  NUMBERS,
} from './rules';
import type { RuleChallenge, RuleContent, RuleProfile } from './types';

export const RULE_DISCOVERY_ID = gameIdOf('rule-discovery');

interface Puzzle<T, R> {
  readonly rule: R;
  readonly fits: T[];
  readonly misses: T[];
  readonly answer: T;
  readonly wrong: T[];
}

/**
 * Picks labelled examples and options for a hidden rule, then checks every considered rule: any
 * rule that agrees with all the examples must also pick the same single option. So the answer
 * does not depend on which consistent rule the player found.
 */
export function buildPuzzle<T, R>(
  random: RandomGenerator,
  universe: readonly T[],
  rule: R,
  fits: (rule: R, item: T) => boolean,
  considered: readonly R[],
  examples: number,
  options: number,
): Puzzle<T, R> | null {
  const yes = universe.filter((item) => fits(rule, item));
  const no = universe.filter((item) => !fits(rule, item));
  if (yes.length < examples + 1 || no.length < examples + options - 1) return null;
  const pickedYes = sample(random, yes, examples + 1);
  const pickedNo = sample(random, no, examples + options - 1);
  const answer = pickedYes[examples] as T;
  const fitsShown = pickedYes.slice(0, examples);
  const missesShown = pickedNo.slice(0, examples);
  const wrong = pickedNo.slice(examples);
  const consistent = considered.filter(
    (r) => fitsShown.every((item) => fits(r, item)) && missesShown.every((item) => !fits(r, item)),
  );
  const unique = consistent.every((r) => fits(r, answer) && wrong.every((item) => !fits(r, item)));
  return unique ? { rule, fits: fitsShown, misses: missesShown, answer, wrong } : null;
}

const numberPuzzle = (random: RandomGenerator, profile: RuleProfile) => {
  const considered = profile.number.considered.flatMap(numberRules);
  return retryGeneration('number rule puzzle', () => {
    const rule = pick(random, numberRules(pick(random, profile.number.hidden)));
    return buildPuzzle(
      random,
      NUMBERS,
      rule,
      numberFits,
      considered,
      profile.examples,
      profile.options,
    );
  });
};

const glyphPuzzle = (random: RandomGenerator, profile: RuleProfile) => {
  const considered = profile.glyph.considered.flatMap(glyphRules);
  return retryGeneration('glyph rule puzzle', () => {
    const rule = pick(random, glyphRules(pick(random, profile.glyph.hidden)));
    return buildPuzzle(
      random,
      GLYPHS,
      rule,
      glyphFits,
      considered,
      profile.examples,
      profile.options,
    );
  });
};

const byKey = (a: Glyph, b: Glyph) => glyphKey(a).localeCompare(glyphKey(b));

export const ruleDiscoveryGame: GameDefinition<RuleChallenge, RuleProfile> = {
  id: RULE_DISCOVERY_ID,
  name: 'Rule Discovery',
  tagline: 'Spot the hidden rule from examples.',
  description:
    'Some items fit a secret rule and some do not. Compare the two groups, work out the rule, and choose the new item that fits it. Higher levels use rules with “not”, “or” and “and”, and give fewer examples.',
  area: 'logic',
  skills: ['abstraction', 'pattern-recognition', 'logical-reasoning'],
  meta: {
    category: 'logic',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'Exactly one option fits every rule that matches the examples. Your result is the share of puzzles answered correctly; there is no time limit.',
    feedback: 'explain',
  },
  instructions: [
    'The items under “Fits the rule” all follow one secret rule. The items under “Does not fit” break it.',
    'Look for what every item that fits has in common — and what the others lack.',
    'Then choose the one option that fits the same rule.',
    'Shapes are named by colour and shape, so you never need to tell colours apart by sight alone.',
  ],
  simpleInstructions: 'Find what the “yes” items share and pick the new one that matches.',
  levels: RULE_DISCOVERY_LEVELS,
  generate({ identity, profile, random }) {
    const useNumbers =
      profile.glyph.hidden.length === 0 ||
      (profile.number.hidden.length > 0 && chance(random, profile.numberShare));
    let content: RuleContent;
    let answer: string;
    let wrong: string[];
    if (useNumbers) {
      const p = numberPuzzle(random, profile);
      content = {
        kind: 'numbers',
        rule: p.rule,
        fits: [...p.fits].sort((a, b) => a - b),
        misses: [...p.misses].sort((a, b) => a - b),
      };
      answer = String(p.answer);
      wrong = p.wrong.map(String);
    } else {
      const p = glyphPuzzle(random, profile);
      content = {
        kind: 'glyphs',
        rule: p.rule,
        fits: [...p.fits].sort(byKey),
        misses: [...p.misses].sort(byKey),
      };
      answer = glyphLabel(p.answer);
      wrong = p.wrong.map(glyphLabel);
    }
    const rule = describeRule(content.rule);
    const draft: Draft<RuleChallenge> = {
      prompt: `Which ${content.kind === 'numbers' ? 'number' : 'shape'} fits the rule?`,
      content,
      response: singleChoice(random, answer, wrong),
      explanation: `The rule is: ${rule}. ${capitalize(answer)} fits it; ${listJoin(wrong)} do not. Every other simple rule either breaks one of the examples or picks the same answer.`,
      skills: ['abstraction', 'pattern-recognition'],
    };
    return { ...identity, ...draft, timing: profile.timing };
  },
};
