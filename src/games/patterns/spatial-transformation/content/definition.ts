import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg, type Message, type Text } from '@/domain/shared';
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

const T = 'patterns:spatialTransformation';

/** Short instruction for each move, as shown to the player ("Turn it a quarter turn clockwise"). */
export const STEP_WORDS: Record<Step, Message> = {
  cw: msg(`${T}.step.cw`),
  ccw: msg(`${T}.step.ccw`),
  '180': msg(`${T}.step.180`),
  'flip-lr': msg(`${T}.step.flip-lr`),
  'flip-ud': msg(`${T}.step.flip-ud`),
};

export const applySteps = (grid: TileGrid, steps: readonly Step[]): TileGrid =>
  steps.reduce<TileGrid>((g, step) => applyTransform(g, step), grid);

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
    // Inline forms ("first turn it…") and what each move does are their own messages.
    const prompt =
      steps.length === 1
        ? msg(`${T}.prompt.single`, { step: STEP_WORDS[steps[0] as Step] })
        : msg(`${T}.prompt.double`, {
            first: msg(`${T}.stepInline.${steps[0] as Step}`),
            second: msg(`${T}.stepInline.${steps[1] as Step}`),
          });
    const parts: Text[] = steps.map((s, i) =>
      steps.length > 1
        ? msg(`${T}.explanation.numbered`, {
            index: i + 1,
            step: msg(`${T}.stepInline.${s}`),
            effect: msg(`${T}.effect.${s}`),
          })
        : msg(`${T}.explanation.single`, { step: STEP_WORDS[s], effect: msg(`${T}.effect.${s}`) }),
    );
    return {
      prompt,
      content: { kind: steps.length === 1 ? 'single' : 'double', grid, steps },
      response: singleChoice(random, answer, wrong),
      explanation: joinText([...parts, msg(`${T}.explanation.others`)], ' '),
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
  name: msg('patterns:spatialTransformation.name'),
  tagline: msg('patterns:spatialTransformation.tagline'),
  description: msg('patterns:spatialTransformation.description'),
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
    scoringSummary: msg('patterns:spatialTransformation.scoringSummary'),
    feedback: 'explain',
    accessibilityNotes: msg('patterns:spatialTransformation.accessibilityNotes'),
  },
  instructions: [
    msg('patterns:spatialTransformation.instructions.1'),
    msg('patterns:spatialTransformation.instructions.2'),
    msg('patterns:spatialTransformation.instructions.3'),
  ],
  simpleInstructions: msg('patterns:spatialTransformation.simpleInstructions'),
  levels: SPATIAL_TRANSFORM_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...draft(random, profile), timing: profile.timing };
  },
};
