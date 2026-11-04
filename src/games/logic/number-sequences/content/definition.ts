import { numericResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, randomInt, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg, type Text } from '@/domain/shared';
import type { Draft } from '@/games/logic/shared/content';
import { NUMBER_SEQUENCES_LEVELS } from './levels';
import { uniqueHiddenTerm } from './rules';
import type { SequenceChallenge, SequenceProfile, SequenceRule } from './types';

export const NUMBER_SEQUENCES_ID = gameIdOf('number-sequences');

const LENGTH = 7;

interface Built {
  readonly terms: number[];
  /** Why the rule produces these terms, in plain words. */
  readonly rule: Text;
}

const step = (random: RandomGenerator, min: number, max: number, negative: boolean) => {
  const size = randomInt(random, min, max);
  return negative && chance(random, 0.4) ? -size : size;
};

const R = (path: string, values?: Record<string, Text | number>) =>
  msg(`logic:numberSequences.rule.${path}`, values);
/** "add 3" / "subtract 3". */
const signed = (d: number) => (d >= 0 ? R('add', { n: d }) : R('subtract', { n: -d }));
/** "(the terms) add 3" / "(the terms) subtract 3", as said of several terms. */
const signedTerms = (d: number) =>
  d >= 0 ? R('termsAdd', { n: d }) : R('termsSubtract', { n: -d });

function makeTerms(
  random: RandomGenerator,
  rule: SequenceRule,
  profile: SequenceProfile,
): Built | null {
  const neg = profile.negativeSteps;
  const seq = (first: number[], next: (s: number[], i: number) => number) => {
    const s = [...first];
    while (s.length < LENGTH) s.push(next(s, s.length));
    return s;
  };
  switch (rule) {
    case 'add': {
      const d = step(random, 1, neg ? 12 : 9, neg);
      const a = d < 0 ? randomInt(random, 40, 90) : randomInt(random, 0, 20);
      return {
        terms: seq([a], (s, i) => (s[i - 1] as number) + d),
        rule: R('constant', { step: signed(d) }),
      };
    }
    case 'multiply': {
      const r = pick(random, neg ? [2, 3, 4] : [2, 3]);
      const a = randomInt(random, 1, r === 2 ? 6 : 2);
      return {
        terms: seq([a], (s, i) => (s[i - 1] as number) * r),
        rule: R('multiply', { r }),
      };
    }
    case 'alternating-add': {
      const d0 = step(random, 1, 9, false);
      const d1 = step(random, 1, 9, neg);
      if (d0 === d1) return null;
      const a = randomInt(random, 0, 20);
      return {
        terms: seq([a], (s, i) => (s[i - 1] as number) + (i % 2 === 1 ? d0 : d1)),
        rule: R('alternate', { a: signed(d0), b: signed(d1) }),
      };
    }
    case 'growing-add': {
      const d0 = randomInt(random, 1, 5);
      const dd = randomInt(random, 1, neg ? 4 : 2);
      const a = randomInt(random, 0, 10);
      return {
        terms: seq([a], (s, i) => (s[i - 1] as number) + d0 + (i - 1) * dd),
        rule: R('growing', { dd, a: d0, b: d0 + dd, c: d0 + 2 * dd }),
      };
    }
    case 'interleaved': {
      const da = step(random, 1, 6, neg);
      const db = step(random, 1, 6, neg);
      if (da === db) return null;
      const a = randomInt(random, da < 0 ? 30 : 0, da < 0 ? 50 : 20);
      const b = randomInt(random, db < 0 ? 30 : 0, db < 0 ? 50 : 20);
      return {
        terms: seq([a, b], (s, i) => (s[i - 2] as number) + (i % 2 === 0 ? da : db)),
        rule: R('interleaved', { a: signedTerms(da), b: signedTerms(db) }),
      };
    }
    case 'two-step': {
      const r = pick(random, [2, 3]);
      const b = step(random, 1, 5, neg);
      const a = randomInt(random, 1, 4);
      const multiplyFirst = chance(random, 0.5);
      return {
        terms: seq([a], (s, i) => {
          const prev = s[i - 1] as number;
          return (i % 2 === 1) === multiplyFirst ? prev * r : prev + b;
        }),
        rule: multiplyFirst
          ? R('multiplyThenAdd', { r, step: signed(b) })
          : R('addThenMultiply', { r, step: signed(b) }),
      };
    }
    case 'sum-of-two': {
      const a = randomInt(random, 1, 5);
      const b = randomInt(random, 1, 6);
      return {
        terms: seq([a, b], (s, i) => (s[i - 1] as number) + (s[i - 2] as number)),
        rule: R('sumOfTwo'),
      };
    }
  }
}

function buildSequence(random: RandomGenerator, profile: SequenceProfile) {
  const rule = weightedPick(random, profile.rules);
  const built = makeTerms(random, rule, profile);
  if (!built) return null;
  const { terms } = built;
  if (terms.some((v) => Math.abs(v) > profile.maxValue)) return null;
  if (new Set(terms).size < 4) return null;
  const missing = chance(random, profile.missingShare);
  const hidden = missing ? randomInt(random, 4, LENGTH - 2) : LENGTH - 1;
  // Every rule in the library that fits the visible terms must agree on the hidden one.
  const answer = uniqueHiddenTerm(terms, hidden);
  if (answer !== terms[hidden]) return null;
  return { rule, built, hidden, answer, missing };
}

export const numberSequencesGame: GameDefinition<SequenceChallenge, SequenceProfile> = {
  id: NUMBER_SEQUENCES_ID,
  name: msg('logic:numberSequences.name'),
  tagline: msg('logic:numberSequences.tagline'),
  description: msg('logic:numberSequences.description'),
  area: 'logic',
  skills: ['pattern-recognition', 'logical-reasoning', 'working-memory'],
  meta: {
    category: 'logic',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'numeric',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('logic:numberSequences.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('logic:numberSequences.instructions.1'),
    msg('logic:numberSequences.instructions.2'),
    msg('logic:numberSequences.instructions.3'),
    msg('logic:numberSequences.instructions.4'),
  ],
  simpleInstructions: msg('logic:numberSequences.simpleInstructions'),
  levels: NUMBER_SEQUENCES_LEVELS,
  generate({ identity, profile, random }) {
    const { rule, built, hidden, answer, missing } = retryGeneration('number sequence', () =>
      buildSequence(random, profile),
    );
    const terms = built.terms.map((v, i) => (i === hidden ? null : v));
    const shown = joinText(
      built.terms.map((v, i) => (i === hidden ? `[${v}]` : String(v))),
      ', ',
    );
    const draft: Draft<SequenceChallenge> = {
      prompt: msg(`logic:numberSequences.prompt.${missing ? 'missing' : 'next'}`),
      content: { kind: rule, terms, hiddenIndex: hidden },
      response: numericResponse(answer),
      explanation: msg('logic:numberSequences.explanation', { rule: built.rule, shown, answer }),
      skills: ['pattern-recognition', 'logical-reasoning'],
    };
    return { ...identity, ...draft, timing: profile.timing };
  },
};
