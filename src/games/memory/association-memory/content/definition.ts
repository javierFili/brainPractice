import { retryGeneration, type GameDefinition } from '@/domain/game';
import {
  chance,
  pick,
  randomInt,
  sample,
  weightedPick,
  type RandomGenerator,
} from '@/domain/random';
import { gameIdOf, msg, textId, type Text } from '@/domain/shared';
import {
  ALL_WORDS,
  colorLabel,
  COLORS,
  distinctGlyphs,
  glyphKey,
  glyphLabel,
  nearGlyph,
  OBJECT_CATEGORIES,
  OBJECTS,
  objectsOf,
  sampleObjects,
  wordLabel,
  type Glyph,
} from '@/games/kit/content';
import { objectById, objectByName, textChoice } from '../../shared/content';
import { ASSOCIATION_LEVELS } from './levels';
import type {
  AssocItem,
  AssocPair,
  AssociationChallenge,
  AssociationContent,
  AssociationProfile,
} from './types';

export function itemLabel(item: AssocItem): Text {
  switch (item.type) {
    case 'object':
      return objectById(item.id).label;
    case 'color':
      return colorLabel(item.color);
    case 'glyph':
      return glyphLabel(item.glyph);
    case 'word':
      return wordLabel(item.word);
    case 'number':
      return String(item.value);
  }
}

/** Words that are not also object names, so a word option never shows a picture. */
const WORDS = ALL_WORDS.filter((w) => objectByName(w) === undefined);

const objectsFor = (random: RandomGenerator, count: number, similar: boolean) => {
  if (!similar) return sampleObjects(random, count);
  const families = OBJECT_CATEGORIES.filter((c) => objectsOf(c).length >= count);
  return sample(random, objectsOf(pick(random, families)), count);
};

/** Look-alike glyphs: each new one differs from an earlier one in a single feature. */
function nearGlyphs(random: RandomGenerator, count: number): Glyph[] {
  const glyphs: Glyph[] = [];
  const keys = new Set<string>();
  const add = (g: Glyph) => {
    if (keys.has(glyphKey(g))) return;
    keys.add(glyphKey(g));
    glyphs.push(g);
  };
  add(distinctGlyphs(random, 1)[0] as Glyph);
  while (glyphs.length < count) add(nearGlyph(random, pick(random, glyphs)));
  return glyphs;
}

/** Two-digit numbers; similar ones are all built from the same three digits (e.g. 37, 73, 33). */
function numbersFor(random: RandomGenerator, count: number, similar: boolean): number[] {
  const values = new Set<number>();
  const digits = sample(random, [1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
  while (values.size < count) {
    values.add(
      similar ? pick(random, digits) * 10 + pick(random, digits) : randomInt(random, 10, 99),
    );
  }
  return [...values];
}

function pairsFor(
  random: RandomGenerator,
  kind: AssociationContent['kind'],
  profile: AssociationProfile,
): AssocPair[] {
  const n = profile.pairs;
  switch (kind) {
    case 'object-color': {
      const colors = sample(random, COLORS, n);
      return objectsFor(random, n, profile.similar).map((o, i) => ({
        cue: { type: 'object', id: o.id },
        partner: { type: 'color', color: colors[i] as (typeof COLORS)[number] },
      }));
    }
    case 'glyph-object': {
      const glyphs = profile.similar ? nearGlyphs(random, n) : distinctGlyphs(random, n);
      const objects = sample(random, OBJECTS, n);
      return glyphs.map((glyph, i) => ({
        cue: { type: 'glyph', glyph },
        partner: { type: 'object', id: (objects[i] as (typeof OBJECTS)[number]).id },
      }));
    }
    case 'word-number': {
      const words = sample(random, WORDS, n);
      const numbers = numbersFor(random, n, profile.similar);
      return words.map((word, i) => ({
        cue: { type: 'word', word },
        partner: { type: 'number', value: numbers[i] as number },
      }));
    }
  }
}

export const ASSOCIATION_MEMORY_ID = gameIdOf('association-memory');

export const associationMemoryGame: GameDefinition<AssociationChallenge, AssociationProfile> = {
  id: ASSOCIATION_MEMORY_ID,
  name: msg('memory:associationMemory.name'),
  tagline: msg('memory:associationMemory.tagline'),
  description: msg('memory:associationMemory.description'),
  area: 'memory',
  skills: ['short-term-memory', 'long-term-recall', 'visual-memory'],
  meta: {
    category: 'memory',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 3,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('memory:associationMemory.scoringSummary'),
    feedback: 'brief',
  },
  instructions: [
    msg('memory:associationMemory.instructions.study'),
    msg('memory:associationMemory.instructions.pick'),
    msg('memory:associationMemory.instructions.exact'),
    msg('memory:associationMemory.instructions.reversed'),
  ],
  simpleInstructions: msg('memory:associationMemory.simpleInstructions'),
  levels: ASSOCIATION_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    const pairs = retryGeneration('distinct pairs', () => {
      const made = pairsFor(random, kind, profile);
      const labels = made.flatMap((p) => [itemLabel(p.cue), itemLabel(p.partner)].map(textId));
      return new Set(labels).size === labels.length ? made : null;
    });
    const index = randomInt(random, 0, pairs.length - 1);
    const reversed = profile.reversedShare > 0 && chance(random, profile.reversedShare);
    const side = (p: AssocPair) => (reversed ? p.cue : p.partner);
    const asked = pairs[index] as AssocPair;
    const shown = itemLabel(reversed ? asked.partner : asked.cue);
    const correct = itemLabel(side(asked));
    const others = pairs.filter((_, i) => i !== index).map((p) => itemLabel(side(p)));
    const options = Math.min(profile.options, pairs.length);
    return {
      ...identity,
      prompt: msg(`memory:associationMemory.prompt.${kind}.${reversed ? 'reversed' : 'forward'}`, {
        item: shown,
      }),
      studyPrompt: msg('memory:associationMemory.studyPrompt', { count: pairs.length }),
      content: { kind, pairs, ask: { pair: index, reversed } },
      response: textChoice(random, correct, sample(random, others, options - 1)),
      explanation: msg('memory:associationMemory.explanation', {
        cue: itemLabel(asked.cue),
        partner: itemLabel(asked.partner),
      }),
      skills: profile.similar ? ['short-term-memory', 'visual-memory'] : ['short-term-memory'],
      timing: profile.timing,
    };
  },
};
