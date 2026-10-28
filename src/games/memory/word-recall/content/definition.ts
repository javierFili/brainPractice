import { multiSelectResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { pick, sample, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { ALL_WORDS, untimed, WORD_GROUPS, type WordGroup } from '@/games/kit/content';
import { orderingResponse } from '../../shared/content';
import { WORD_RECALL_LEVELS } from './levels';
import type { WordRecallChallenge, WordRecallProfile, WordRecallVariant } from './types';

const THEMES = Object.keys(WORD_GROUPS) as WordGroup[];

/** Words the list and its lures come from: every word, or the words of a few themes. */
function poolFor(random: RandomGenerator, variant: WordRecallVariant): readonly string[] {
  if (variant.kind !== 'similar') return ALL_WORDS;
  return sample(random, THEMES, variant.themes).flatMap((t) => WORD_GROUPS[t]);
}

export const WORD_RECALL_ID = gameIdOf('word-recall');

export const wordRecallGame: GameDefinition<WordRecallChallenge, WordRecallProfile> = {
  id: WORD_RECALL_ID,
  name: 'Word Recall',
  tagline: 'Read a list of words, then find them again.',
  description:
    'Words appear one at a time. Then pick them out on a board that also has new words — later from the same themes, so “it was a kitchen word” is not enough. Some higher-level lists must be put back in order.',
  area: 'memory',
  skills: ['short-term-memory', 'auditory-memory', 'sequential-thinking'],
  meta: {
    category: 'memory',
    audiences: ['teens', 'adults', 'seniors'],
    interaction: 'mixed',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'A board counts when your marks match the list within the allowed slips (missed words plus wrong marks); an order counts when every word is in place. Your result is the share of lists recalled; answering is not timed.',
    feedback: 'brief',
  },
  instructions: [
    'Read each word as it appears. Saying it quietly to yourself can help.',
    'Then mark the words you saw on the board and press Check.',
    'On some levels one slip is allowed; on others, put the words back in the order shown.',
    'Keyboard: arrow keys move between words, Enter marks one.',
  ],
  simpleInstructions: 'Read the words, then find them again.',
  levels: WORD_RECALL_LEVELS,
  generate({ identity, profile, random }) {
    const variant = pick(random, profile.variants);
    const studyMs = variant.words * profile.itemMs + 1000;
    const timing = untimed(variant.words * 2000 + 4000, studyMs);
    const pool = poolFor(random, variant);
    const base = {
      ...identity,
      timing,
      skills: ['short-term-memory'] as const,
    };
    if (variant.kind === 'order') {
      const studied = sample(random, pool, variant.words);
      return {
        ...base,
        prompt: `Put the ${variant.words} words in the order they appeared.`,
        studyPrompt: 'Read the words and remember their order.',
        content: { kind: variant.kind, studied, board: [], itemMs: profile.itemMs },
        response: orderingResponse(
          random,
          studied.map((word) => ({ id: word, label: word })),
        ),
        explanation: `The order was: ${studied.join(', ')}.`,
        skills: ['short-term-memory', 'sequential-thinking'],
      };
    }
    const chosen = sample(random, pool, variant.board);
    const studied = chosen.slice(0, variant.words);
    const board = shuffle(random, chosen);
    const targets = board.flatMap((word, i) => (studied.includes(word) ? [i] : []));
    const exact = variant.maxErrors === 0;
    return {
      ...base,
      prompt: exact
        ? `Mark the ${variant.words} words you saw.`
        : `Mark the words you saw (there were ${variant.words}; one slip is allowed).`,
      studyPrompt: 'Read the words.',
      content: { kind: variant.kind, studied, board, itemMs: profile.itemMs },
      response: multiSelectResponse(board.length, targets, {
        exact,
        maxErrors: variant.maxErrors,
      }),
      explanation: `The list was: ${studied.join(', ')}.`,
    };
  },
};
