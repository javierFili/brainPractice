import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import {
  applyTransform,
  gridKey,
  isAsymmetric,
  makeGrid,
  sameGrid,
  TRANSFORMS,
  type Draft,
  type TileGrid,
} from '../../shared/content';
import { SPATIAL_TRANSFORM_LEVELS } from './levels';
import type { SpatialTransformChallenge, SpatialTransformProfile, Step } from './types';

export const SPATIAL_TRANSFORM_ID = gameIdOf('spatial-transformation');

/** Short instruction for each move, as shown to the player. */
export const STEP_WORDS: Record<Step, string> = {
  cw: 'Turn it a quarter turn clockwise',
  ccw: 'Turn it a quarter turn anticlockwise',
  '180': 'Turn it a half turn',
  'flip-lr': 'Flip it left to right',
  'flip-ud': 'Flip it upside down',
};

/** What each move does, for the explanation. */
const STEP_EFFECT: Record<Step, string> = {
  cw: 'the top row becomes the right-hand column',
  ccw: 'the top row becomes the left-hand column',
  '180': 'the top row becomes the bottom row, read backwards',
  'flip-lr': 'the left and right columns swap places, like a mirror standing beside it',
  'flip-ud': 'the top and bottom rows swap places, like a mirror lying under it',
};

export const applySteps = (grid: TileGrid, steps: readonly Step[]): TileGrid =>
  steps.reduce<TileGrid>((g, step) => applyTransform(g, step), grid);

const lower = (text: string) => `${text.charAt(0).toLowerCase()}${text.slice(1)}`;

function draft(random: RandomGenerator, profile: SpatialTransformProfile) {
  return retryGeneration('transformation', (): Draft<SpatialTransformChallenge> | null => {
    const { size, tiles } = profile;
    const grid = makeGrid(size, size, () =>
      chance(random, 0.45) ? randomInt(random, 1, tiles) : 0,
    );
    const share = grid.flat().filter((v) => v > 0).length / (size * size);
    // All eight turned/flipped versions must look different, or two options could both be right.
    if (share < 0.3 || share > 0.65 || !isAsymmetric(grid)) return null;
    const steps = Array.from({ length: profile.stepCount }, () => pick(random, profile.moves));
    const result = applySteps(grid, steps);
    // Two moves that cancel out would leave the pattern unchanged.
    if (steps.length > 1 && sameGrid(result, grid)) return null;
    const answer = gridKey(result);
    const others = TRANSFORMS.map((t) => gridKey(applyTransform(grid, t))).filter(
      (k) => k !== answer,
    );
    const wrong = sample(random, others, profile.options - 1);
    const said = steps.map((s) => STEP_WORDS[s]);
    const prompt =
      steps.length === 1
        ? `${said[0] ?? ''}. Which option shows the result?`
        : `First ${lower(said[0] ?? '')}, then ${lower(said[1] ?? '')}. Which option shows the result?`;
    const explanation = steps
      .map(
        (s, i) =>
          `${steps.length > 1 ? `Step ${i + 1}: ` : ''}${lower(STEP_WORDS[s])}: ${STEP_EFFECT[s]}.`,
      )
      .join(' ');
    return {
      prompt,
      content: { kind: steps.length === 1 ? 'single' : 'double', grid, steps },
      response: singleChoice(random, answer, wrong),
      explanation: `${explanation.charAt(0).toUpperCase()}${explanation.slice(1)} The other options are the pattern turned or flipped in other ways.`,
      skills:
        steps.length === 1
          ? ['spatial-reasoning', 'visual-orientation']
          : ['spatial-reasoning', 'visual-orientation', 'sequential-thinking'],
    };
  });
}

export const spatialTransformGame: GameDefinition<
  SpatialTransformChallenge,
  SpatialTransformProfile
> = {
  id: SPATIAL_TRANSFORM_ID,
  name: 'Spatial Transformation',
  tagline: 'Turn it, flip it, picture the result.',
  description:
    'A pattern on a grid and an instruction: turn it, flip it, or from level 7 do two moves in a row. Choose the picture of the result. Patterns grow from 3×3 to 5×5 and gain coloured tiles.',
  area: 'patterns',
  skills: ['spatial-reasoning', 'visual-orientation', 'sequential-thinking'],
  meta: {
    category: 'patterns',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'Each pattern counts as correct when you choose the result of the stated moves. Your result is the share of correct choices; there is no time limit.',
    feedback: 'explain',
    accessibilityNotes:
      'Patterns and options are read aloud row by row, which makes picturing the move much harder than with the picture.',
  },
  instructions: [
    'Read the instruction and picture the pattern moving: a turn spins it on the table, a flip turns it over like a page.',
    'With two moves, do the first one, then the second on the result.',
    'Choose the option that shows the result. Keys 1 to 8 pick an option.',
  ],
  simpleInstructions: 'Do the turn or flip in your head and pick the picture you get.',
  levels: SPATIAL_TRANSFORM_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...draft(random, profile), timing: profile.timing };
  },
};
