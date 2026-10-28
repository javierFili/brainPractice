import { numericResponse, singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { booleanAssignments, listJoin, PEOPLE, type Draft } from '@/games/logic/shared/content';
import { TRUTH_LEVELS } from './levels';
import { claimValue, consistentWorlds, describeClaim, describeGroup } from './solver';
import type { Claim, ClaimType, TruthChallenge, TruthContent, TruthProfile } from './types';

export const TRUTH_AND_FALSEHOOD_ID = gameIdOf('truth-and-falsehood');

function claimFor(
  random: RandomGenerator,
  type: ClaimType,
  speaker: number,
  n: number,
): Claim | null {
  const others = [...Array(n).keys()].filter((i) => i !== speaker);
  const honest = random.next() < 0.5;
  switch (type) {
    case 'is':
      // Never "I am a liar" (a paradox) or "I am a truth-teller" (says nothing).
      return { type, target: pick(random, others), honest };
    case 'same':
    case 'different': {
      if (n < 2) return null;
      const [a, b] = sample(random, [...Array(n).keys()], 2).sort((x, y) => x - y) as [
        number,
        number,
      ];
      return { type, a, b };
    }
    case 'count':
      return {
        type,
        op: pick(random, ['at-least', 'exactly', 'at-most'] as const),
        k: randomInt(random, 1, n - 1),
        honest,
      };
    case 'either': {
      if (n < 3) return null;
      const [a, b] = sample(random, others, 2).sort((x, y) => x - y) as [number, number];
      return { type, a, b, honest };
    }
  }
}

function buildPuzzle(random: RandomGenerator, profile: TruthProfile) {
  const n = profile.characters;
  const claims: Claim[] = [];
  for (let speaker = 0; speaker < n; speaker++) {
    const claim = claimFor(random, weightedPick(random, profile.claimTypes), speaker, n);
    if (!claim) return null;
    claims.push(claim);
  }
  const worlds = consistentWorlds(claims);
  if (worlds.length !== 1) return null;
  return { claims, solution: worlds[0] as boolean[] };
}

/** "only Ana tells the truth", "Ana and Ben tell the truth", "nobody tells the truth". */
function whoTellsTruth(world: readonly boolean[], names: readonly string[]): string {
  const honest = names.filter((_, i) => world[i]);
  if (honest.length === 0) return 'nobody tells the truth';
  if (honest.length === names.length) return 'everyone tells the truth';
  return honest.length === 1
    ? `only ${honest[0] as string} tells the truth`
    : `${listJoin(honest)} tell the truth`;
}

export const truthAndFalsehoodGame: GameDefinition<TruthChallenge, TruthProfile> = {
  id: TRUTH_AND_FALSEHOOD_ID,
  name: 'Truth and Falsehood',
  tagline: 'Some always tell the truth, some always lie.',
  description:
    'Each character is either a truth-teller, who only says true things, or a liar, who only says false things. Test each possibility against what they say to find the only one that works. Higher levels add characters and statements about the whole group.',
  area: 'logic',
  skills: ['logical-reasoning', 'problem-solving', 'working-memory'],
  meta: {
    category: 'logic',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'mixed',
    estimatedMinutes: 5,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'Exactly one way of sorting truth-tellers and liars fits what everyone says. Your result is the share of puzzles answered correctly; there is no time limit.',
    feedback: 'explain',
  },
  instructions: [
    'A truth-teller only says true things. A liar only says false things.',
    'Pick one character and suppose they tell the truth. Does everything else still fit? If not, they must be lying.',
    'Exactly one way of sorting everyone works. Use it to answer the question.',
  ],
  simpleInstructions: 'Truth-tellers never lie, liars never tell the truth — find out who is who.',
  levels: TRUTH_LEVELS,
  generate({ identity, profile, random }) {
    const { claims, solution } = retryGeneration('truth puzzle', () =>
      buildPuzzle(random, profile),
    );
    const names = sample(random, PEOPLE, profile.characters).sort();
    const ask = weightedPick(random, profile.asks);
    const target = randomInt(random, 0, names.length - 1);
    const content: TruthContent = { kind: ask, names, claims, solution, target };
    const targetName = names[target] as string;
    const response =
      ask === 'one'
        ? singleChoice(random, solution[target] ? 'Truth-teller' : 'Liar', [
            solution[target] ? 'Liar' : 'Truth-teller',
          ])
        : ask === 'count'
          ? numericResponse(solution.filter(Boolean).length)
          : singleChoice(
              random,
              describeGroup(solution, names),
              sample(
                random,
                booleanAssignments(names.length)
                  .filter((w) => w.some((h, i) => h !== solution[i]))
                  .map((w) => describeGroup(w, names)),
                Math.min(3, 2 ** names.length - 1),
              ),
            );
    const checks = claims.map((claim, i) => {
      const said = describeClaim(claim, i, names).replace(/\.$/, '');
      const value = claimValue(claim, solution);
      return `${names[i] as string} (${solution[i] ? 'truth-teller' : 'liar'}) says “${said}” — that is ${value ? 'true' : 'false'}`;
    });
    const draft: Draft<TruthChallenge> = {
      prompt:
        ask === 'one'
          ? `Is ${targetName} a truth-teller or a liar?`
          : ask === 'count'
            ? 'How many of them are truth-tellers?'
            : 'Who is telling the truth?',
      content,
      response,
      explanation: `Only one way works: ${whoTellsTruth(solution, names)}. ${checks.join('; ')}. Every other way makes someone break their rule.`,
      skills: ['logical-reasoning', 'problem-solving'],
    };
    return { ...identity, ...draft, timing: profile.timing };
  },
};
