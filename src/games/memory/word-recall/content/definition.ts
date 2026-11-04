import { multiSelectResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { pick, sample, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg } from '@/domain/shared';
import { ALL_WORDS, untimed, WORD_GROUPS, wordLabel, type WordGroup } from '@/games/kit/content';
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
  name: msg('memory:wordRecall.name'),
  tagline: msg('memory:wordRecall.tagline'),
  description: msg('memory:wordRecall.description'),
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
    scoringSummary: msg('memory:wordRecall.scoringSummary'),
    feedback: 'brief',
  },
  instructions: [
    msg('memory:wordRecall.instructions.read'),
    msg('memory:wordRecall.instructions.mark'),
    msg('memory:wordRecall.instructions.variants'),
    msg('memory:wordRecall.instructions.keyboard'),
  ],
  simpleInstructions: msg('memory:wordRecall.simpleInstructions'),
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
        prompt: msg('memory:wordRecall.prompt.order', { count: variant.words }),
        studyPrompt: msg('memory:wordRecall.studyPrompt.order'),
        content: { kind: variant.kind, studied, board: [], itemMs: profile.itemMs },
        response: orderingResponse(
          random,
          studied.map((word) => ({ id: word, label: wordLabel(word) })),
        ),
        explanation: msg('memory:wordRecall.explanation.order', {
          words: joinText(studied.map(wordLabel), ', '),
        }),
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
      prompt: msg(`memory:wordRecall.prompt.${exact ? 'exact' : 'tolerant'}`, {
        count: variant.words,
      }),
      studyPrompt: msg('memory:wordRecall.studyPrompt.recognise'),
      content: { kind: variant.kind, studied, board, itemMs: profile.itemMs },
      response: multiSelectResponse(board.length, targets, {
        exact,
        maxErrors: variant.maxErrors,
      }),
      explanation: msg('memory:wordRecall.explanation.list', {
        words: joinText(studied.map(wordLabel), ', '),
      }),
    };
  },
};
