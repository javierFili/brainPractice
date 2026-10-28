import { pairsResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { pick, sample, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import {
  ALL_GLYPHS,
  COLORS,
  distinctGlyphs,
  OBJECT_CATEGORIES,
  objectsOf,
  sampleObjects,
  SHAPES,
  glyphKey,
  type Glyph,
} from '@/games/kit/content';
import { MEMORY_CARDS_LEVELS } from './levels';
import type { CardFace, MemoryCardsChallenge, MemoryCardsProfile } from './types';

/** Faces in couples of look-alikes: same shape in two colours, or same colour in two shapes. */
function nearGlyphFaces(random: RandomGenerator, pairs: number): Glyph[] {
  const faces = new Map<string, Glyph>();
  while (faces.size < pairs) {
    const base = pick(random, ALL_GLYPHS);
    const twin =
      random.next() < 0.5
        ? {
            ...base,
            color: pick(
              random,
              COLORS.filter((c) => c !== base.color),
            ),
          }
        : {
            ...base,
            shape: pick(
              random,
              SHAPES.filter((s) => s !== base.shape),
            ),
          };
    for (const glyph of [base, twin]) {
      if (faces.size < pairs) faces.set(glyphKey(glyph), glyph);
    }
  }
  return [...faces.values()];
}

function facesFor(random: RandomGenerator, profile: MemoryCardsProfile): CardFace[] {
  switch (profile.kind) {
    case 'objects':
      return sampleObjects(random, profile.pairs).map((o) => ({ type: 'object', objectId: o.id }));
    case 'family': {
      const families = OBJECT_CATEGORIES.filter((c) => objectsOf(c).length >= profile.pairs);
      return sample(random, objectsOf(pick(random, families)), profile.pairs).map((o) => ({
        type: 'object',
        objectId: o.id,
      }));
    }
    case 'glyphs':
      return distinctGlyphs(random, profile.pairs).map((glyph) => ({ type: 'glyph', glyph }));
    case 'near-glyphs':
      return nearGlyphFaces(random, profile.pairs).map((glyph) => ({ type: 'glyph', glyph }));
  }
}

export const MEMORY_CARDS_ID = gameIdOf('memory-cards');

export const memoryCardsGame: GameDefinition<MemoryCardsChallenge, MemoryCardsProfile> = {
  id: MEMORY_CARDS_ID,
  name: 'Memory Cards',
  tagline: 'Turn two cards, find the twins.',
  description:
    'A board of face-down cards hides pairs of identical pictures. Turn two cards at a time and remember where each picture is, to find every pair with as few misses as possible.',
  area: 'memory',
  skills: ['visual-memory', 'short-term-memory', 'concentration'],
  meta: {
    category: 'memory',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'pairs',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'completion-time'],
    scoringSummary:
      'A board counts as solved when you find every pair within the allowed number of misses. Accuracy is the share of boards solved; there is no time limit.',
    feedback: 'brief',
  },
  instructions: [
    'Some levels start by showing every card for a moment: look at where things are.',
    'Turn over two cards. If they match, they stay face up; if not, they turn back.',
    'Find every pair before you run out of misses (shown under the board).',
    'Keyboard: move between cards with the arrow keys and press Enter to turn one over.',
  ],
  simpleInstructions: 'Turn two cards at a time and find the matching pictures.',
  levels: MEMORY_CARDS_LEVELS,
  generate({ identity, profile, random }) {
    const faces = facesFor(random, profile);
    const order = shuffle(random, [...faces.keys(), ...faces.keys()]);
    const positions = faces.map((_, face) =>
      order.flatMap((f, index) => (f === face ? [index] : [])),
    );
    const pairs = positions.map(([a, b]) => [a as number, b as number] as const);
    return {
      ...identity,
      prompt: `Find all ${profile.pairs} pairs.`,
      studyPrompt: 'Look at the cards — they will turn face down.',
      content: {
        kind: profile.kind,
        faces: order.map((face) => faces[face] as CardFace),
        columns: profile.columns,
      },
      response: pairsResponse(pairs, profile.maxMisses),
      explanation: `Every picture appeared on exactly two cards. Up to ${profile.maxMisses} mismatched turns were allowed on this board.`,
      skills: ['visual-memory', 'short-term-memory'],
      timing: profile.timing,
    };
  },
};
