import { numericResponse, singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { ordinal } from '../../shared/content';
import { NUMBER_RECALL_LEVELS } from './levels';
import type { ChunkedNumber, NumberRecallChallenge, NumberRecallProfile } from './types';

const LABELS = ['Phone', 'Door code', 'Locker', 'Ticket', 'Order', 'Flight', 'Room', 'Account'];

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
  name: 'Number Recall',
  tagline: 'Codes, phone numbers, tickets: hold them for a moment.',
  description:
    'A number appears in chunks, like a phone number or a door code. When it is hidden, type it back, say which chunk came in a given place, or — with two numbers on screen — recall the one that is asked.',
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
    scoringSummary:
      'An answer counts when the whole number is typed exactly or the right chunk is picked. Your result is the share of numbers recalled; answering is not timed.',
    feedback: 'brief',
  },
  instructions: [
    'Read the number. The gaps split it into chunks, which are easier to hold.',
    'When it is hidden, answer the question: type the number without spaces, or pick a chunk.',
    'Some levels show two numbers with names: remember both, only one will be asked.',
  ],
  simpleInstructions: 'Look at the number, then type it back.',
  levels: NUMBER_RECALL_LEVELS,
  generate({ identity, profile, random }) {
    const variant = pick(random, profile.variants);
    const count = variant.kind === 'two-numbers' ? 2 : 1;
    const labels = sample(random, LABELS, count);
    // Two numbers must differ, or "which one was asked" would not matter.
    const numbers = retryGeneration('distinct numbers', () => {
      const made = labels.map((label) => ({
        label,
        groups: distinctChunks(random, variant.groups),
      }));
      return new Set(made.map(valueOf)).size === made.length ? made : null;
    });
    const asked = randomInt(random, 0, count - 1);
    const target = numbers[asked] as ChunkedNumber;
    const base = { ...identity, timing: profile.timing, studyPrompt: 'Remember the number.' };

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
        prompt: `Which chunk came ${ordinal(position + 1)}?`,
        studyPrompt: 'Remember the chunks and their order.',
        content: { kind: variant.kind, numbers, ask: { number: asked, group: position } },
        response: singleChoice(random, correct, [...seen, ...lures]),
        explanation: `The ${target.label} number was ${spoken(target)}; chunk ${position + 1} was ${correct}.`,
        skills: ['short-term-memory', 'sequential-thinking'],
      };
    }
    return {
      ...base,
      prompt:
        variant.kind === 'type-back'
          ? `Type the ${target.label} number, without spaces.`
          : `Type the ${target.label} number (not the ${(numbers[1 - asked] as ChunkedNumber).label}).`,
      ...(variant.kind === 'two-numbers' ? { studyPrompt: 'Remember both numbers.' } : {}),
      content: { kind: variant.kind, numbers, ask: { number: asked, group: null } },
      response: numericResponse(valueOf(target)),
      explanation:
        variant.kind === 'type-back'
          ? `The ${target.label} number was ${spoken(target)}.`
          : `${numbers.map((n) => `${n.label}: ${spoken(n)}`).join('; ')}. The ${target.label} number was asked.`,
      skills:
        variant.kind === 'type-back'
          ? ['short-term-memory']
          : ['working-memory', 'short-term-memory'],
    };
  },
};
