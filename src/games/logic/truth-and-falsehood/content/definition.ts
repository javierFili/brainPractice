import { numericResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg, type Text } from '@/domain/shared';
import {
  booleanAssignments,
  listText,
  PEOPLE,
  textChoice,
  type Draft,
} from '@/games/logic/shared/content';
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

const key = (path: string) => `logic:truthAndFalsehood.${path}`;

/** "only Ana tells the truth", "Ana and Ben tell the truth", "nobody tells the truth". */
function whoTellsTruth(world: readonly boolean[], names: readonly string[]): Text {
  const honest = names.filter((_, i) => world[i]);
  if (honest.length === 0) return msg(key('who.nobody'));
  if (honest.length === names.length) return msg(key('who.everyone'));
  return honest.length === 1
    ? msg(key('who.only'), { name: honest[0] as string })
    : msg(key('who.many'), { names: listText(honest) });
}

/** "Truth-teller" / "Liar" (capitalised: option labels). */
export const roleLabel = (honest: boolean): Text => msg(key(`role.${honest ? 'honest' : 'liar'}`));

export const truthAndFalsehoodGame: GameDefinition<TruthChallenge, TruthProfile> = {
  id: TRUTH_AND_FALSEHOOD_ID,
  name: msg('logic:truthAndFalsehood.name'),
  tagline: msg('logic:truthAndFalsehood.tagline'),
  description: msg('logic:truthAndFalsehood.description'),
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
    scoringSummary: msg('logic:truthAndFalsehood.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('logic:truthAndFalsehood.instructions.1'),
    msg('logic:truthAndFalsehood.instructions.2'),
    msg('logic:truthAndFalsehood.instructions.3'),
  ],
  simpleInstructions: msg('logic:truthAndFalsehood.simpleInstructions'),
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
        ? textChoice(random, roleLabel(solution[target] === true), [
            roleLabel(solution[target] !== true),
          ])
        : ask === 'count'
          ? numericResponse(solution.filter(Boolean).length)
          : textChoice(
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
    const checks = claims.map((claim, i) =>
      msg(key(`check.${claimValue(claim, solution) ? 'true' : 'false'}`), {
        name: names[i] as string,
        role: msg(key(`roleLower.${solution[i] ? 'honest' : 'liar'}`)),
        said: describeClaim(claim, i, names),
      }),
    );
    const draft: Draft<TruthChallenge> = {
      prompt:
        ask === 'one' ? msg(key('prompt.one'), { name: targetName }) : msg(key(`prompt.${ask}`)),
      content,
      response,
      explanation: msg(key('explanation'), {
        who: whoTellsTruth(solution, names),
        checks: joinText(checks, '; '),
      }),
      skills: ['logical-reasoning', 'problem-solving'],
    };
    return { ...identity, ...draft, timing: profile.timing };
  },
};
