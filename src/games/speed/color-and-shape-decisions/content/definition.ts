import type { GameDefinition } from '@/domain/game';
import { chance, pick, randomInt } from '@/domain/random';
import { gameIdOf, joinText, msg, type Text } from '@/domain/shared';
import {
  SHAPES,
  colorLabel,
  glyphLabel,
  shapeLabel,
  type ColorName,
  type Glyph,
} from '@/games/kit/content';
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

/** Between the colour and the shape of a shared key ("red / circle"). */
export const PAIR_SEPARATOR = ' / ';

/** Option labels in key order: fixed for a level, so each key keeps its meaning all session. */
export function optionLabels(
  mapping: ResponseMapping,
  pairs: readonly ValuePair[],
  rule: Dimension,
): Text[] {
  if (mapping === 'shared')
    return pairs.map((p) => joinText([colorLabel(p.color), shapeLabel(p.shape)], PAIR_SEPARATOR));
  const colors = pairs.map((p) => colorLabel(p.color));
  const shapes = pairs.map((p) => shapeLabel(p.shape));
  if (mapping === 'separate') return [...colors, ...shapes];
  return rule === 'colour' ? colors : shapes;
}

export const COLOR_AND_SHAPE_ID = gameIdOf('color-and-shape-decisions');

export const colorAndShapeGame: GameDefinition<ColorShapeChallenge, ColorShapeProfile> = {
  id: COLOR_AND_SHAPE_ID,
  name: msg('speed:colorAndShapeDecisions.name'),
  tagline: msg('speed:colorAndShapeDecisions.tagline'),
  description: msg('speed:colorAndShapeDecisions.description'),
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
    scoringSummary: msg('speed:colorAndShapeDecisions.scoringSummary'),
    feedback: 'brief',
    accessibilityNotes: msg('speed:colorAndShapeDecisions.accessibilityNotes'),
  },
  instructions: [
    msg('speed:colorAndShapeDecisions.instructions.cue'),
    msg('speed:colorAndShapeDecisions.instructions.keys'),
    msg('speed:colorAndShapeDecisions.instructions.shared'),
    msg('speed:colorAndShapeDecisions.instructions.check'),
  ],
  simpleInstructions: msg('speed:colorAndShapeDecisions.simpleInstructions'),
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
    const value = rule === 'colour' ? colorLabel(glyph.color) : shapeLabel(glyph.shape);
    return {
      ...identity,
      prompt: msg(`speed:colorAndShapeDecisions.prompt.${rule}`),
      content: {
        kind: rule,
        mapping,
        glyph,
        pairs,
        congruent: mapping === 'single' ? true : congruent,
      },
      response: fixedChoice(labels, correct),
      explanation: msg(
        `speed:colorAndShapeDecisions.explanation.${rule}${mapping === 'shared' ? 'Shared' : ''}`,
        {
          glyph: glyphLabel(glyph),
          value,
          option: labels[correct] ?? value,
        },
      ),
      skills:
        mapping === 'single'
          ? ['processing-speed', 'selective-attention']
          : ['cognitive-flexibility', 'processing-speed'],
      timing: profile.timing,
    };
  },
};
