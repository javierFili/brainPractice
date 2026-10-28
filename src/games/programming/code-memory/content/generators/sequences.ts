import { singleChoice, type ResponseOf } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { pick, randomInt, sample, shuffle, type RandomGenerator } from '@/domain/random';
import type { CodeMemoryProfile } from '../types';
import { callsOn, RESOURCES } from '../vocabulary';
import type { MemoryDraft } from './draft';

const ITEM_IDS = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Distinct calls. Similar sequences reuse two resources, so calls differ only by method or path
 * depth (`GET /users/{id}` vs `DELETE /users/{id}`): order has to be encoded, not the gist.
 */
function buildCalls(random: RandomGenerator, length: number, similar: boolean) {
  if (similar) return sample(random, sample(random, RESOURCES, 2).flatMap(callsOn), length);
  return sample(random, RESOURCES, length).map((resource) => pick(random, callsOn(resource)));
}

/** Calls on the same resources that did not run: plausible lures when the sequence is short. */
const unseenCalls = (calls: readonly string[]) => {
  const used = RESOURCES.filter((resource) =>
    calls.some((call) => call.split(' ')[1]?.startsWith(`/${resource.name}`)),
  );
  return used.flatMap(callsOn).filter((call) => !calls.includes(call));
};

const listing = (calls: readonly string[]) =>
  calls.map((call, i) => `${i + 1}. ${call}`).join(', ');

function orderingResponse(random: RandomGenerator, calls: readonly string[]) {
  const shown = shuffle(random, calls);
  if (shown.every((call, i) => call === calls[i])) return null;
  const items = shown.map((label, i) => ({ id: ITEM_IDS.charAt(i), label }));
  const idOf = (call: string) => items.find((item) => item.label === call)?.id ?? '';
  const response: ResponseOf<'ordering'> = {
    format: 'ordering',
    question: { items },
    solution: { order: calls.map(idOf) },
  };
  return response;
}

/** A sequence of calls; recall one by position, one by what preceded it, or the whole order. */
export function sequenceRecall(random: RandomGenerator, profile: CodeMemoryProfile): MemoryDraft {
  const { sequenceLength, questions, similarCalls } = profile.sequence;
  return retryGeneration('sequence-recall', () => {
    const calls = buildCalls(random, sequenceLength, similarCalls);
    const question = pick(random, questions);
    const skills = ['working-memory', 'algorithmic-thinking'] as const;

    if (question === 'order') {
      const response = orderingResponse(random, calls);
      if (response === null) return null;
      return {
        prompt: 'Put the calls back in the order they ran.',
        content: { kind: 'sequence-recall', calls, ask: { type: 'order' } },
        response,
        explanation: `The calls ran in this order: ${calls.join(' → ')}.`,
        skills,
      };
    }

    const index =
      question === 'position'
        ? randomInt(random, 0, calls.length - 1)
        : randomInt(random, 0, calls.length - 2);
    const answerIndex = question === 'position' ? index : index + 1;
    const answer = calls[answerIndex] as string;
    const asked = question === 'successor' ? calls[index] : undefined;
    const excluded = new Set([answer, asked]);
    // Neighbours first (off-by-one is the most common sequencing slip), then the rest of the
    // sequence, then calls on the same resources that never ran.
    const neighbours = [calls[answerIndex - 1], calls[answerIndex + 1], calls[index - 1]].filter(
      (call): call is string => call !== undefined && !excluded.has(call),
    );
    const others = calls.filter((call) => !excluded.has(call) && !neighbours.includes(call));
    const distractors = [
      ...new Set([
        ...shuffle(random, neighbours),
        ...shuffle(random, others),
        ...shuffle(random, unseenCalls(calls)),
      ]),
    ].slice(0, profile.distractors);
    if (distractors.length < profile.distractors) return null;

    const prompt =
      question === 'position'
        ? `Which call was #${index + 1}?`
        : `Which call came right after ${asked ?? ''}?`;
    const reason =
      question === 'position'
        ? `call #${index + 1} was ${answer}`
        : `right after ${asked ?? ''} came ${answer}`;
    return {
      prompt,
      content: {
        kind: 'sequence-recall',
        calls,
        ask: question === 'position' ? { type: 'position', index } : { type: 'successor', index },
      },
      response: singleChoice(random, answer, distractors),
      explanation: `The sequence was ${listing(calls)}; ${reason}.`,
      skills,
    };
  });
}
