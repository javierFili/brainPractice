import { multiSelectResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { sample } from '@/domain/random';
import { gameIdOf, joinText, msg } from '@/domain/shared';
import { cellName } from '../../shared/content';
import { POSITION_MEMORY_LEVELS } from './levels';
import type { PositionMemoryChallenge, PositionMemoryProfile } from './types';

export const POSITION_MEMORY_ID = gameIdOf('position-memory');

export const positionMemoryGame: GameDefinition<PositionMemoryChallenge, PositionMemoryProfile> = {
  id: POSITION_MEMORY_ID,
  name: msg('memory:positionMemory.name'),
  tagline: msg('memory:positionMemory.tagline'),
  description: msg('memory:positionMemory.description'),
  area: 'memory',
  skills: ['visual-memory', 'spatial-reasoning', 'short-term-memory', 'selective-attention'],
  meta: {
    category: 'memory',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'grid',
    estimatedMinutes: 3,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('memory:positionMemory.scoringSummary'),
    feedback: 'brief',
  },
  instructions: [
    msg('memory:positionMemory.instructions.watch'),
    msg('memory:positionMemory.instructions.mark'),
    msg('memory:positionMemory.instructions.filter'),
    msg('memory:positionMemory.instructions.keyboard'),
  ],
  simpleInstructions: msg('memory:positionMemory.simpleInstructions'),
  levels: POSITION_MEMORY_LEVELS,
  generate({ identity, profile, random }) {
    const cells = profile.size * profile.size;
    const lit = sample(
      random,
      Array.from({ length: cells }, (_, i) => i),
      profile.targets + profile.distractors,
    );
    const targets = lit.slice(0, profile.targets).sort((a, b) => a - b);
    const distractors = lit.slice(profile.targets).sort((a, b) => a - b);
    return {
      ...identity,
      prompt: msg(`memory:positionMemory.prompt.${profile.kind}`, { count: profile.targets }),
      studyPrompt: msg(`memory:positionMemory.studyPrompt.${profile.kind}`),
      content: { kind: profile.kind, size: profile.size, targets, distractors },
      response: multiSelectResponse(cells, targets),
      explanation: msg('memory:positionMemory.explanation', {
        cells: joinText(
          targets.map((i) => cellName(i, profile.size)),
          '; ',
        ),
      }),
      skills:
        profile.kind === 'plain'
          ? ['visual-memory', 'spatial-reasoning']
          : ['visual-memory', 'selective-attention'],
      timing: profile.timing,
    };
  },
};
