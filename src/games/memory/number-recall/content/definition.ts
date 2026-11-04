import { numericResponse, singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg, type Message } from '@/domain/shared';
import { ordinal } from '../../shared/content';
import { NUMBER_RECALL_LEVELS } from './levels';
import type { ChunkedNumber, NumberRecallChallenge, NumberRecallProfile } from './types';

/** Ids of the names a number can have; `numberName` is what people read. */
const NAMES = ['phone', 'doorCode', 'locker', 'ticket', 'order', 'flight', 'room', 'account'];

/** "Phone", "Door code"… in the reader's language. */
export const numberName = (n: ChunkedNumber): Message => msg(`memory:numberRecall.names.${n.name}`);

/** Chunk of `size` digits with a non-zero first digit, so typed numbers never lose a zero. */
const chunk = (random: RandomGenerator, size: number) =>
  Array.from({ length: size }, (_, i) => String(randomInt(random, i === 0 ? 1 : 0, 9))).join('');

/** Chunks that are all different, so "which chunk came second" has one answer. */
function distinctChunks(random: RandomGenerator, sizes: readonly number[]): string[] {
  const groups: string[] = [];
  for (const size of sizes) {
    let next = chunk(random, size);
    while (groups.includes(next)) next = chunk(random, size);
    groups.push(next);
  }
  return groups;
}

export const spoken = (n: ChunkedNumber) => n.groups.join(' ');
export const valueOf = (n: ChunkedNumber) => Number(n.groups.join(''));

const OPTIONS = 4;

export const NUMBER_RECALL_ID = gameIdOf('number-recall');

export const numberRecallGame: GameDefinition<NumberRecallChallenge, NumberRecallProfile> = {
  id: NUMBER_RECALL_ID,
  name: msg('memory:numberRecall.name'),
  tagline: msg('memory:numberRecall.tagline'),
  description: msg('memory:numberRecall.description'),
  area: 'memory',
  skills: ['short-term-memory', 'working-memory', 'sequential-thinking'],
  meta: {
    category: 'memory',
    audiences: ['teens', 'adults', 'seniors'],
    interaction: 'mixed',
    estimatedMinutes: 3,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('memory:numberRecall.scoringSummary'),
    feedback: 'brief',
  },
  instructions: [
    msg('memory:numberRecall.instructions.read'),
    msg('memory:numberRecall.instructions.answer'),
    msg('memory:numberRecall.instructions.two'),
  ],
  simpleInstructions: msg('memory:numberRecall.simpleInstructions'),
  levels: NUMBER_RECALL_LEVELS,
  generate({ identity, profile, random }) {
    const variant = pick(random, profile.variants);
    const count = variant.kind === 'two-numbers' ? 2 : 1;
    const names = sample(random, NAMES, count);
    // Two numbers must differ, or "which one was asked" would not matter.
    const numbers = retryGeneration('distinct numbers', () => {
      const made = names.map((name) => ({
        name,
        groups: distinctChunks(random, variant.groups),
      }));
      return new Set(made.map(valueOf)).size === made.length ? made : null;
    });
    const asked = randomInt(random, 0, count - 1);
    const target = numbers[asked] as ChunkedNumber;
    const base = {
      ...identity,
      timing: profile.timing,
      studyPrompt: msg('memory:numberRecall.studyPrompt.one'),
    };

    if (variant.kind === 'which-group') {
      const position = randomInt(random, 0, target.groups.length - 1);
      const correct = target.groups[position] as string;
      // Distractors: the other chunks you saw (so "I saw it" is not enough), plus unseen chunks
      // of the same length when there are too few.
      const seen = sample(
        random,
        target.groups.filter((_, i) => i !== position),
        Math.min(OPTIONS - 1, target.groups.length - 1),
      );
      const size = correct.length;
      const lures: string[] = [];
      while (seen.length + lures.length < OPTIONS - 1) {
        const lure = chunk(random, size);
        if (!target.groups.includes(lure) && !lures.includes(lure)) lures.push(lure);
      }
      return {
        ...base,
        prompt: msg('memory:numberRecall.prompt.whichGroup', { turn: ordinal(position + 1) }),
        studyPrompt: msg('memory:numberRecall.studyPrompt.chunks'),
        content: { kind: variant.kind, numbers, ask: { number: asked, group: position } },
        response: singleChoice(random, correct, [...seen, ...lures]),
        explanation: msg('memory:numberRecall.explanation.whichGroup', {
          name: numberName(target),
          number: spoken(target),
          position: position + 1,
          chunk: correct,
        }),
        skills: ['short-term-memory', 'sequential-thinking'],
      };
    }
    return {
      ...base,
      prompt:
        variant.kind === 'type-back'
          ? msg('memory:numberRecall.prompt.typeBack', { name: numberName(target) })
          : msg('memory:numberRecall.prompt.twoNumbers', {
              name: numberName(target),
              other: numberName(numbers[1 - asked] as ChunkedNumber),
            }),
      ...(variant.kind === 'two-numbers'
        ? { studyPrompt: msg('memory:numberRecall.studyPrompt.both') }
        : {}),
      content: { kind: variant.kind, numbers, ask: { number: asked, group: null } },
      response: numericResponse(valueOf(target)),
      explanation:
        variant.kind === 'type-back'
          ? msg('memory:numberRecall.explanation.typeBack', {
              name: numberName(target),
              number: spoken(target),
            })
          : msg('memory:numberRecall.explanation.twoNumbers', {
              numbers: joinText(
                numbers.map((n) =>
                  msg('memory:numberRecall.entry', { name: numberName(n), number: spoken(n) }),
                ),
                '; ',
              ),
              name: numberName(target),
            }),
      skills:
        variant.kind === 'type-back'
          ? ['short-term-memory']
          : ['working-memory', 'short-term-memory'],
    };
  },
};
