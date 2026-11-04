import { sequenceResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { pick, sample, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
import { SEQUENCE_RECALL_LEVELS } from './levels';
import { paletteSymbols } from './symbols';
import type { SequenceRecallChallenge, SequenceRecallProfile } from './types';

function sequenceOf(
  random: RandomGenerator,
  ids: readonly string[],
  profile: SequenceRecallProfile,
) {
  const items: string[] = [];
  while (items.length < profile.length) {
    const previous = items.at(-1);
    // Repeats are allowed but never back to back: an immediate repeat is invisible when shown.
    const choices = ids.filter((id) => id !== previous && (profile.repeats || !items.includes(id)));
    items.push(pick(random, choices));
  }
  return items;
}

export const SEQUENCE_RECALL_ID = gameIdOf('sequence-recall');

export const sequenceRecallGame: GameDefinition<SequenceRecallChallenge, SequenceRecallProfile> = {
  id: SEQUENCE_RECALL_ID,
  name: msg('memory:sequenceRecall.name'),
  tagline: msg('memory:sequenceRecall.tagline'),
  description: msg('memory:sequenceRecall.description'),
  area: 'memory',
  skills: ['short-term-memory', 'working-memory', 'sequential-thinking'],
  meta: {
    category: 'memory',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'sequence',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'streak'],
    scoringSummary: msg('memory:sequenceRecall.scoringSummary'),
    feedback: 'brief',
  },
  instructions: [
    msg('memory:sequenceRecall.instructions.watch'),
    msg('memory:sequenceRecall.instructions.rebuild'),
    msg('memory:sequenceRecall.instructions.reverse'),
    msg('memory:sequenceRecall.instructions.undo'),
  ],
  simpleInstructions: msg('memory:sequenceRecall.simpleInstructions'),
  levels: SEQUENCE_RECALL_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    const all = paletteSymbols(profile.palette);
    const symbols = sample(random, all, Math.min(profile.paletteSize, all.length));
    // The pad keeps a stable order (digits ascending) so position on the pad carries no clue.
    const pad = all.filter((s) => symbols.includes(s));
    const items = sequenceOf(
      random,
      pad.map((s) => s.id),
      profile,
    );
    const solution = kind === 'forward' ? items : [...items].reverse();
    return {
      ...identity,
      prompt: msg(`memory:sequenceRecall.prompt.${kind}`, { count: items.length }),
      studyPrompt: msg(`memory:sequenceRecall.studyPrompt.${kind}`),
      content: { kind, palette: profile.palette, items, itemMs: profile.itemMs },
      response: sequenceResponse(pad, solution),
      explanation: msg(`memory:sequenceRecall.explanation.${kind}`),
      skills: kind === 'forward' ? ['short-term-memory'] : ['working-memory', 'short-term-memory'],
      timing: profile.timing,
    };
  },
};
