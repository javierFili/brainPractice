import { sequenceResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { pick, sample, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
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
  name: 'Sequence Recall',
  tagline: 'Watch the sequence, then rebuild it.',
  description:
    'Colours, digits or shapes appear one after another. When they are gone, rebuild the sequence on the answer pad — in the same order, or from last to first when asked.',
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
    scoringSummary:
      'A sequence counts as correct only when every position matches. Your result is the share of sequences rebuilt exactly; answering is not timed.',
    feedback: 'brief',
  },
  instructions: [
    'Watch the symbols appear one at a time. Press “I’m ready” if you want to answer early.',
    'Rebuild the sequence by pressing the symbols in order (or the number keys shown on them).',
    'Some sequences ask for reverse order: start with the last symbol you saw.',
    'Undo (or Backspace) removes the last symbol; submit when every slot is filled.',
  ],
  simpleInstructions: 'Watch the colours, then press them in the same order.',
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
      prompt:
        kind === 'forward'
          ? `Rebuild the ${items.length} symbols in the order you saw them.`
          : `Rebuild the ${items.length} symbols in reverse order — last one first.`,
      studyPrompt:
        kind === 'forward'
          ? 'Watch the sequence.'
          : 'Watch the sequence — you will repeat it backwards.',
      content: { kind, palette: profile.palette, items, itemMs: profile.itemMs },
      response: sequenceResponse(pad, solution),
      explanation:
        kind === 'forward'
          ? 'The sequence had to be repeated exactly as shown.'
          : 'The sequence had to be repeated from the last symbol back to the first.',
      skills: kind === 'forward' ? ['short-term-memory'] : ['working-memory', 'short-term-memory'],
      timing: profile.timing,
    };
  },
};
