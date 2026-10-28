import { locateResponse, singleChoice } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, weightedPick } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { OBJECT_CATEGORIES, objectsOf, sampleObjects } from '@/games/kit/content';
import { cellName, objectById, ordinal } from '../../shared/content';
import { DUAL_MEMORY_LEVELS } from './levels';
import type { DualMemoryChallenge, DualMemoryProfile, Placement } from './types';

const OPTIONS = 4;

export const DUAL_MEMORY_ID = gameIdOf('dual-memory-challenge');

export const dualMemoryGame: GameDefinition<DualMemoryChallenge, DualMemoryProfile> = {
  id: DUAL_MEMORY_ID,
  name: 'Dual Memory Challenge',
  tagline: 'What, where and when — all at once.',
  description:
    'Objects appear one at a time, each in its own square. Keep both things in mind — where each object was and in which order they came — because the question may ask about either, or both together.',
  area: 'memory',
  skills: ['working-memory', 'visual-memory', 'spatial-reasoning', 'sequential-thinking'],
  meta: {
    category: 'memory',
    audiences: ['teens', 'adults', 'seniors'],
    interaction: 'mixed',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'An answer counts when you point at the right square or pick the right object. Questions about place and about order are mixed at random, so the result reflects both. Answering is not timed.',
    feedback: 'brief',
  },
  instructions: [
    'Objects appear one by one, each in a square of the grid.',
    'Remember where each one was and the order they came in.',
    'You will be asked one question: where something was, which object came in a given turn, or which object was in a marked square.',
    'Keyboard: arrow keys move between squares, Enter chooses; number keys pick an option.',
  ],
  simpleInstructions: 'Watch where each picture appears and in what order.',
  levels: DUAL_MEMORY_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    const cells = profile.size * profile.size;
    const objects = profile.family
      ? sample(
          random,
          objectsOf(
            pick(
              random,
              OBJECT_CATEGORIES.filter((c) => objectsOf(c).length >= profile.objects),
            ),
          ),
          profile.objects,
        )
      : sampleObjects(random, profile.objects);
    const spots = sample(
      random,
      Array.from({ length: cells }, (_, i) => i),
      profile.objects,
    );
    const placements: Placement[] = objects.map((o, i) => ({
      objectId: o.id,
      cell: spots[i] as number,
    }));
    const ask = randomInt(random, 0, placements.length - 1);
    const target = placements[ask] as Placement;
    const name = objectById(target.objectId).name;
    const where = cellName(target.cell, profile.size);
    const turn = ordinal(ask + 1);
    const content = { kind, size: profile.size, placements, ask, itemMs: profile.itemMs };
    const base = {
      ...identity,
      studyPrompt: 'Remember where each object appears, and in what order.',
      content,
      timing: profile.timing,
    };
    const fact = `The ${name} came ${turn}, at ${where}.`;
    if (kind === 'where' || kind === 'where-nth') {
      return {
        ...base,
        prompt: kind === 'where' ? `Where was the ${name}?` : `Where was the ${turn} object?`,
        response: locateResponse(cells, target.cell),
        explanation: fact,
        skills:
          kind === 'where'
            ? ['visual-memory', 'spatial-reasoning']
            : ['working-memory', 'spatial-reasoning', 'sequential-thinking'],
      };
    }
    // Distractors are other objects that were shown, so "I saw it" never gives the answer away.
    const others = placements.filter((_, i) => i !== ask).map((p) => objectById(p.objectId).name);
    return {
      ...base,
      prompt:
        kind === 'which-nth'
          ? `Which object came ${turn}?`
          : 'Which object was in the marked square?',
      response: singleChoice(
        random,
        name,
        sample(random, others, Math.min(OPTIONS - 1, others.length)),
      ),
      explanation: fact,
      skills:
        kind === 'which-nth'
          ? ['sequential-thinking', 'short-term-memory']
          : ['visual-memory', 'spatial-reasoning'],
    };
  },
};
