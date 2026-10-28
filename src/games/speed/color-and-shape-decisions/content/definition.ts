import type { GameDefinition } from '@/domain/game';
import { chance, pick, randomInt } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { SHAPES, glyphLabel, type ColorName, type Glyph } from '@/games/kit/content';
import { fixedChoice, SPEED_SCORING } from '@/games/speed/shared/content';
import { COLOR_SHAPE_LEVELS } from './levels';
import type {
  ColorShapeChallenge,
  ColorShapeProfile,
  Dimension,
  ResponseMapping,
  ValuePair,
} from './types';

/** Colours for shape-only trials (never a key there); no green, to keep red/green apart. */
const FREE_COLORS: readonly ColorName[] = ['red', 'orange', 'yellow', 'blue', 'purple'];

/** Option labels in key order: fixed for a level, so each key keeps its meaning all session. */
export function optionLabels(
  mapping: ResponseMapping,
  pairs: readonly ValuePair[],
  rule: Dimension,
): string[] {
  if (mapping === 'shared') return pairs.map((p) => `${p.color} / ${p.shape}`);
  const colors = pairs.map((p) => p.color);
  const shapes = pairs.map((p) => p.shape);
  if (mapping === 'separate') return [...colors, ...shapes];
  return rule === 'colour' ? colors : shapes;
}

export const COLOR_AND_SHAPE_ID = gameIdOf('color-and-shape-decisions');

export const colorAndShapeGame: GameDefinition<ColorShapeChallenge, ColorShapeProfile> = {
  id: COLOR_AND_SHAPE_ID,
  name: 'Color and Shape Decisions',
  tagline: 'Colour or shape? The cue decides.',
  description:
    'A coloured shape appears with a cue: COLOUR or SHAPE. Answer the feature the cue asks for. Later the same key stands for a colour and a shape at once, so a red square means different answers under each rule — the cue is the only way to know which.',
  area: 'speed',
  skills: ['cognitive-flexibility', 'processing-speed', 'selective-attention'],
  meta: {
    category: 'speed',
    audiences: ['teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 3,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time'],
    scoringSummary:
      'Each answer is right or wrong; accuracy is always reported. Correct answers earn extra points the faster they come, wrong answers cost points, and your response time per answer is shown. Relaxed mode removes the time limit.',
    feedback: 'brief',
    accessibilityNotes:
      'Colour trials ask about colour itself, so they need colour vision; the palette avoids red/green. Every shape is announced with its colour and shape name (e.g. “red square”), and the cue is written as a word.',
  },
  instructions: [
    'Read the cue: COLOUR means answer the colour, SHAPE means answer the shape.',
    'Answer with a click or the number keys; keys keep the same meaning for the whole session.',
    'From level 5 each key means a colour and a shape (“red / circle”).',
    'A red square is “red” under COLOUR but “square” under SHAPE: always check the cue.',
  ],
  simpleInstructions: 'Look at the word on top: say the colour or the shape it asks for.',
  levels: COLOR_SHAPE_LEVELS,
  scoring: SPEED_SCORING,
  generate({ identity, profile, random }) {
    const { pairs, mapping } = profile;
    const rule: Dimension = chance(random, profile.shapeShare) ? 'shape' : 'colour';
    const answerPair = randomInt(random, 0, pairs.length - 1);
    const congruent = !chance(random, profile.incongruentShare);
    const otherPair = congruent
      ? answerPair
      : pick(
          random,
          pairs.map((_, i) => i).filter((i) => i !== answerPair),
        );
    const relevant = pairs[answerPair] as ValuePair;
    const other = pairs[otherPair] as ValuePair;
    // With one rule per level the other feature never maps to a key, so it can vary freely.
    const glyph: Glyph =
      mapping === 'single'
        ? rule === 'colour'
          ? { color: relevant.color, shape: pick(random, SHAPES) }
          : { color: pick(random, FREE_COLORS), shape: relevant.shape }
        : rule === 'colour'
          ? { color: relevant.color, shape: other.shape }
          : { color: other.color, shape: relevant.shape };
    const labels = optionLabels(mapping, pairs, rule);
    const correct =
      mapping === 'separate' && rule === 'shape' ? pairs.length + answerPair : answerPair;
    const value = rule === 'colour' ? glyph.color : glyph.shape;
    return {
      ...identity,
      prompt: rule === 'colour' ? 'COLOUR: what colour is it?' : 'SHAPE: what shape is it?',
      content: {
        kind: rule,
        mapping,
        glyph,
        pairs,
        congruent: mapping === 'single' ? true : congruent,
      },
      response: fixedChoice(labels, correct),
      explanation: `The cue was ${rule === 'colour' ? 'COLOUR' : 'SHAPE'} and it was a ${glyphLabel(glyph)}: the answer is ${value}${mapping === 'shared' ? ` (${labels[correct] ?? value})` : ''}.`,
      skills:
        mapping === 'single'
          ? ['processing-speed', 'selective-attention']
          : ['cognitive-flexibility', 'processing-speed'],
      timing: profile.timing,
    };
  },
};
