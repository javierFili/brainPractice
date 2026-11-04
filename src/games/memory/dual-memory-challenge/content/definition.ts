import { locateResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, weightedPick } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
import { OBJECT_CATEGORIES, objectsOf, sampleObjects } from '@/games/kit/content';
import { cellName, objectById, ordinal, textChoice } from '../../shared/content';
import { DUAL_MEMORY_LEVELS } from './levels';
import type { DualMemoryChallenge, DualMemoryProfile, Placement } from './types';

const OPTIONS = 4;

export const DUAL_MEMORY_ID = gameIdOf('dual-memory-challenge');

export const dualMemoryGame: GameDefinition<DualMemoryChallenge, DualMemoryProfile> = {
  id: DUAL_MEMORY_ID,
  name: msg('memory:dualMemoryChallenge.name'),
  tagline: msg('memory:dualMemoryChallenge.tagline'),
  description: msg('memory:dualMemoryChallenge.description'),
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
    scoringSummary: msg('memory:dualMemoryChallenge.scoringSummary'),
    feedback: 'brief',
  },
  instructions: [
    msg('memory:dualMemoryChallenge.instructions.watch'),
    msg('memory:dualMemoryChallenge.instructions.remember'),
    msg('memory:dualMemoryChallenge.instructions.question'),
    msg('memory:dualMemoryChallenge.instructions.keyboard'),
  ],
  simpleInstructions: msg('memory:dualMemoryChallenge.simpleInstructions'),
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
    const name = objectById(target.objectId).label;
    const where = cellName(target.cell, profile.size);
    const turn = ordinal(ask + 1);
    const content = { kind, size: profile.size, placements, ask, itemMs: profile.itemMs };
    const base = {
      ...identity,
      studyPrompt: msg('memory:dualMemoryChallenge.studyPrompt'),
      content,
      timing: profile.timing,
    };
    const fact = msg('memory:dualMemoryChallenge.explanation', { name, turn, where });
    if (kind === 'where' || kind === 'where-nth') {
      return {
        ...base,
        prompt:
          kind === 'where'
            ? msg('memory:dualMemoryChallenge.prompt.where', { name })
            : msg('memory:dualMemoryChallenge.prompt.whereNth', { turn }),
        response: locateResponse(cells, target.cell),
        explanation: fact,
        skills:
          kind === 'where'
            ? ['visual-memory', 'spatial-reasoning']
            : ['working-memory', 'spatial-reasoning', 'sequential-thinking'],
      };
    }
    // Distractors are other objects that were shown, so "I saw it" never gives the answer away.
    const others = placements.filter((_, i) => i !== ask).map((p) => objectById(p.objectId).label);
    return {
      ...base,
      prompt:
        kind === 'which-nth'
          ? msg('memory:dualMemoryChallenge.prompt.whichNth', { turn })
          : msg('memory:dualMemoryChallenge.prompt.whichHere'),
      response: textChoice(
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
