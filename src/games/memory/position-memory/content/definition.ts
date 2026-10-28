import { multiSelectResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { sample } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { POSITION_MEMORY_LEVELS } from './levels';
import type { PositionMemoryChallenge, PositionMemoryProfile } from './types';

export const POSITION_MEMORY_ID = gameIdOf('position-memory');

export const cellName = (index: number, size: number) =>
  `row ${Math.floor(index / size) + 1}, column ${(index % size) + 1}`;

export const positionMemoryGame: GameDefinition<PositionMemoryChallenge, PositionMemoryProfile> = {
  id: POSITION_MEMORY_ID,
  name: 'Position Memory',
  tagline: 'Where did the lights appear?',
  description:
    'Some cells of a grid light up for a moment. When they go dark, mark the same cells. Higher levels add more cells, bigger grids and decoy cells in another colour that you must ignore.',
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
    scoringSummary:
      'A grid counts as correct when every marked cell is one that lit up. Your result is the share of grids recalled exactly; answering is not timed.',
    feedback: 'brief',
  },
  instructions: [
    'Watch which cells light up. Press “I’m ready” to hide them early.',
    'Mark the same cells, then press Check. The counter shows how many to mark.',
    'From level 5, remember only the blue cells (marked with a dot) and ignore the orange ones (striped).',
    'Keyboard: arrow keys move between cells, Enter marks or unmarks a cell.',
  ],
  simpleInstructions: 'Remember where the lights were, then tap the same squares.',
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
      prompt:
        profile.kind === 'plain'
          ? `Mark the ${profile.targets} cells that lit up.`
          : `Mark the ${profile.targets} blue cells. Ignore the orange ones.`,
      studyPrompt:
        profile.kind === 'plain' ? 'Remember the lit cells.' : 'Remember only the blue cells.',
      content: { kind: profile.kind, size: profile.size, targets, distractors },
      response: multiSelectResponse(cells, targets),
      explanation: `The lit cells were: ${targets.map((i) => cellName(i, profile.size)).join('; ')}.`,
      skills:
        profile.kind === 'plain'
          ? ['visual-memory', 'spatial-reasoning']
          : ['visual-memory', 'selective-attention'],
      timing: profile.timing,
    };
  },
};
