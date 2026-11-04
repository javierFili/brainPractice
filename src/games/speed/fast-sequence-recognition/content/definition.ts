import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { sample, shuffle, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg, type Text } from '@/domain/shared';
import { COLORS, SHAPES, glyphKey, glyphLabel, type Glyph } from '@/games/kit/content';
import { SPEED_SCORING } from '@/games/speed/shared/content';
import { FAST_SEQUENCE_LEVELS } from './levels';
import { recognitionOptions } from './options';
import type { FastSequenceChallenge, FastSequenceProfile, SequenceKind } from './types';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
/** Consonants with distinct outlines (no vowels, so sequences rarely spell words). */
const LETTERS = ['B', 'D', 'F', 'H', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'X', 'Z'];

/** Shape glyphs with all-different shapes, so shapes alone tell any two apart. */
function shapePool(random: RandomGenerator): Record<string, Glyph> {
  const colors = shuffle(random, COLORS);
  const glyphs = sample(random, SHAPES, SHAPES.length).map((shape, i): Glyph => ({
    shape,
    color: colors[i % colors.length] as (typeof COLORS)[number],
  }));
  return Object.fromEntries(glyphs.map((g) => [glyphKey(g), g]));
}

/** Separator between shape names in an option label. */
export const SHAPE_SEPARATOR = ' · ';

export function sequenceLabel(
  kind: SequenceKind,
  items: readonly string[],
  glyphs: Readonly<Record<string, Glyph>>,
): Text {
  if (kind !== 'shapes') return items.join(' ');
  return joinText(
    items.map((id) => glyphLabel(glyphs[id] as Glyph)),
    SHAPE_SEPARATOR,
  );
}

const keyOf = (items: readonly string[]) => items.join('|');

/**
 * Options are drawn by sequence key (shape names are translated messages, compared by identity
 * only through their ids), then labelled.
 */
function labelledChoice(
  random: RandomGenerator,
  kind: SequenceKind,
  items: readonly string[],
  options: readonly (readonly string[])[],
  glyphs: Readonly<Record<string, Glyph>>,
) {
  const labels = new Map(options.map((o) => [keyOf(o), sequenceLabel(kind, o, glyphs)]));
  const correct = keyOf(items);
  const response = singleChoice(
    random,
    correct,
    options.map(keyOf).filter((key) => key !== correct),
  );
  return {
    ...response,
    question: {
      options: response.question.options.map((o) => ({
        ...o,
        label: labels.get(o.label as string) ?? o.label,
      })),
    },
  };
}

export const FAST_SEQUENCE_RECOGNITION_ID = gameIdOf('fast-sequence-recognition');

export const fastSequenceRecognitionGame: GameDefinition<
  FastSequenceChallenge,
  FastSequenceProfile
> = {
  id: FAST_SEQUENCE_RECOGNITION_ID,
  name: msg('speed:fastSequenceRecognition.name'),
  tagline: msg('speed:fastSequenceRecognition.tagline'),
  description: msg('speed:fastSequenceRecognition.description'),
  area: 'speed',
  skills: ['processing-speed', 'short-term-memory', 'visual-memory'],
  meta: {
    category: 'speed',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 3,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time'],
    scoringSummary: msg('speed:fastSequenceRecognition.scoringSummary'),
    feedback: 'brief',
    accessibilityNotes: msg('speed:fastSequenceRecognition.accessibilityNotes'),
  },
  instructions: [
    msg('speed:fastSequenceRecognition.instructions.glimpse'),
    msg('speed:fastSequenceRecognition.instructions.pick'),
    msg('speed:fastSequenceRecognition.instructions.differ'),
  ],
  simpleInstructions: msg('speed:fastSequenceRecognition.simpleInstructions'),
  levels: FAST_SEQUENCE_LEVELS,
  scoring: SPEED_SCORING,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    const glyphs = kind === 'shapes' ? shapePool(random) : {};
    const pool = kind === 'digits' ? DIGITS : kind === 'letters' ? LETTERS : Object.keys(glyphs);
    return retryGeneration('a sequence recognition', () => {
      const items = sample(random, pool, profile.length);
      const options = recognitionOptions(random, items, profile.optionCount, pool, profile.changes);
      if (options === null) return null;
      return {
        ...identity,
        prompt: msg('speed:fastSequenceRecognition.prompt'),
        studyPrompt: msg(`speed:fastSequenceRecognition.studyPrompt.${kind}`, {
          count: profile.length,
        }),
        content: {
          kind,
          items,
          glyphs:
            kind === 'shapes'
              ? Object.fromEntries(items.map((id) => [id, glyphs[id] as Glyph]))
              : {},
        },
        response: labelledChoice(random, kind, items, options, glyphs),
        explanation: msg('speed:fastSequenceRecognition.explanation', {
          sequence: sequenceLabel(kind, items, glyphs),
        }),
        skills: ['processing-speed', 'short-term-memory'],
        timing: profile.timing,
      };
    });
  },
};
