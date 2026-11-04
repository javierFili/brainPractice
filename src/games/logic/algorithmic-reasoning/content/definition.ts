import { locateResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg } from '@/domain/shared';
import type { Draft } from '@/games/logic/shared/content';
import { ROBOT_LEVELS } from './levels';
import { cellLabel, facingLabel, run } from './robot';
import type {
  Block,
  Facing,
  Instruction,
  RobotChallenge,
  RobotContent,
  RobotProfile,
} from './types';

export const ALGORITHMIC_REASONING_ID = gameIdOf('algorithmic-reasoning');

const turn = (random: RandomGenerator, around = false): Instruction => ({
  type: 'turn',
  turn: pick(
    random,
    around ? (['left', 'right', 'around'] as const) : (['left', 'right'] as const),
  ),
});
const forward = (random: RandomGenerator, max = 2): Instruction => ({
  type: 'forward',
  steps: randomInt(random, 1, max),
});

function block(random: RandomGenerator, kind: Block): Instruction {
  switch (kind) {
    case 'forward':
      return forward(random, 3);
    case 'turn':
      return turn(random, true);
    case 'repeat':
      return {
        type: 'repeat',
        times: randomInt(random, 2, 3),
        body: [forward(random, 1), turn(random)],
      };
    case 'nested-repeat':
      return {
        type: 'repeat',
        times: 2,
        body: [{ type: 'repeat', times: 2, body: [forward(random, 1)] }, turn(random)],
      };
    case 'if-blocked':
      return { type: 'if-blocked', then: [turn(random)], otherwise: [forward(random, 1)] };
    case 'until-blocked':
      return { type: 'until-blocked' };
  }
}

const hasType = (program: readonly Instruction[], type: Instruction['type']): boolean =>
  program.some(
    (i) =>
      i.type === type ||
      (i.type === 'repeat' && hasType(i.body, type)) ||
      (i.type === 'if-blocked' && (hasType(i.then, type) || hasType(i.otherwise, type))),
  );

function build(random: RandomGenerator, profile: RobotProfile): RobotContent | null {
  const { size } = profile;
  const cells = [...Array(size * size).keys()];
  const [startCell, ...walls] = sample(random, cells, profile.walls + 1) as [number, ...number[]];
  const program: Instruction[] = [];
  for (let i = 0; i < profile.length; i++)
    program.push(block(random, weightedPick(random, profile.blocks)));
  // Every block type the level offers beyond plain moves should appear.
  const special = (Object.keys(profile.blocks) as Block[]).filter(
    (b) => b !== 'forward' && b !== 'turn',
  );
  const typeOf = (b: Block): Instruction['type'] => (b === 'nested-repeat' ? 'repeat' : b);
  if (special.length > 0 && !special.some((b) => hasType(program, typeOf(b)))) return null;
  const content: RobotContent = {
    kind:
      hasType(program, 'if-blocked') || hasType(program, 'until-blocked')
        ? 'conditions'
        : hasType(program, 'repeat')
          ? 'loops'
          : 'straight',
    size,
    walls: [...walls].sort((a, b) => a - b),
    start: { cell: startCell, facing: randomInt(random, 0, 3) as Facing },
    program,
  };
  const trace = run(content);
  if (!trace || trace.length === 0) return null;
  const end = (trace.at(-1) as (typeof trace)[number]).state.cell;
  if (end === startCell) return null;
  // Conditions must matter: an "until blocked" that never moves is pointless.
  if (trace.some((t) => t.moved === 0)) return null;
  return content;
}

export const algorithmicReasoningGame: GameDefinition<RobotChallenge, RobotProfile> = {
  id: ALGORITHMIC_REASONING_ID,
  name: msg('logic:algorithmicReasoning.name'),
  tagline: msg('logic:algorithmicReasoning.tagline'),
  description: msg('logic:algorithmicReasoning.description'),
  area: 'logic',
  skills: ['algorithmic-thinking', 'sequential-thinking', 'spatial-reasoning', 'working-memory'],
  meta: {
    category: 'logic',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'grid',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('logic:algorithmicReasoning.scoringSummary'),
    feedback: 'explain',
    accessibilityNotes: msg('logic:algorithmicReasoning.accessibilityNotes'),
  },
  instructions: [
    msg('logic:algorithmicReasoning.instructions.1'),
    msg('logic:algorithmicReasoning.instructions.2'),
    msg('logic:algorithmicReasoning.instructions.3'),
    msg('logic:algorithmicReasoning.instructions.4'),
  ],
  simpleInstructions: msg('logic:algorithmicReasoning.simpleInstructions'),
  levels: ROBOT_LEVELS,
  generate({ identity, profile, random }) {
    const content = retryGeneration('robot program', () => build(random, profile));
    const trace = run(content) ?? [];
    const end = (trace.at(-1) as (typeof trace)[number]).state.cell;

    const draft: Draft<RobotChallenge> = {
      prompt: msg('logic:algorithmicReasoning.prompt'),
      content,
      response: locateResponse(content.size * content.size, end),
      explanation: msg('logic:algorithmicReasoning.explanation', {
        start: cellLabel(content.start.cell, content.size),
        facing: facingLabel(content.start.facing),
        steps: joinText(
          trace.map((t) => t.text),
          '; ',
        ),
        end: cellLabel(end, content.size),
      }),
      skills: ['algorithmic-thinking', 'sequential-thinking', 'spatial-reasoning'],
    };
    return { ...identity, ...draft, timing: profile.timing };
  },
};
