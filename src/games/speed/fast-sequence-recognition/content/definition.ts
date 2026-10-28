import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { sample, shuffle, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
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
): string {
  if (kind !== 'shapes') return items.join(' ');
  return items.map((id) => glyphLabel(glyphs[id] as Glyph)).join(SHAPE_SEPARATOR);
}

export const FAST_SEQUENCE_RECOGNITION_ID = gameIdOf('fast-sequence-recognition');

export const fastSequenceRecognitionGame: GameDefinition<
  FastSequenceChallenge,
  FastSequenceProfile
> = {
  id: FAST_SEQUENCE_RECOGNITION_ID,
  name: 'Fast Sequence Recognition',
  tagline: 'One glimpse — which one was it?',
  description:
    'A short sequence of digits, letters or shapes is shown for a moment, then hidden. Pick it out from similar sequences as fast as you can. Sequences grow longer, glimpses get shorter, and at the top the candidates differ only in order.',
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
    scoringSummary:
      'Each pick is right or wrong; a wrong pick costs points. A correct pick earns more the faster it comes after the sequence is hidden, but accuracy carries most of the result. Relaxed timing doubles the glimpse and removes the answer limit.',
    feedback: 'brief',
    accessibilityNotes:
      'The glimpse is a single, still display (no flashing). Screen readers announce the sequence once when it appears; a short glimpse can end before it is read, so relaxed timing is recommended with a screen reader.',
  },
  instructions: [
    'A sequence appears briefly. Take it in as a whole — press “I’m ready” if you are done early.',
    'When it disappears, pick the same sequence among the candidates (click or number keys).',
    'Candidates differ by one symbol or by two neighbours swapped.',
  ],
  simpleInstructions: 'Look at the row, then find the same row.',
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
      const correct = sequenceLabel(kind, items, glyphs);
      const distractors = options
        .map((o) => sequenceLabel(kind, o, glyphs))
        .filter((label) => label !== correct);
      return {
        ...identity,
        prompt: 'Which sequence did you see?',
        studyPrompt: `Take in these ${profile.length} ${kind === 'shapes' ? 'shapes' : kind}.`,
        content: {
          kind,
          items,
          glyphs:
            kind === 'shapes'
              ? Object.fromEntries(items.map((id) => [id, glyphs[id] as Glyph]))
              : {},
        },
        response: singleChoice(random, correct, distractors),
        explanation: `The sequence was ${correct}.`,
        skills: ['processing-speed', 'short-term-memory'],
        timing: profile.timing,
      };
    });
  },
};
