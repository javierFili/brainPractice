import { locateResponse, multiSelectResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { randomInt, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { untimed } from '@/games/kit/content';
import { cellName } from '../../shared/content';
import { WORKING_GRID_LEVELS } from './levels';
import type { WorkingGridChallenge, WorkingGridContent, WorkingGridProfile } from './types';

function streamOf(random: RandomGenerator, cells: number, length: number): number[] {
  const stream: number[] = [];
  while (stream.length < length) {
    const next = randomInt(random, 0, cells - 1);
    // An immediate repeat would look like one long light.
    if (next !== stream.at(-1)) stream.push(next);
  }
  return stream;
}

/** The answer of a challenge, recomputed from the stream alone. */
export function solve(content: WorkingGridContent): readonly number[] {
  const { stream, depth, kind } = content;
  if (kind === 'last-k') return stream.slice(-depth);
  return [stream[stream.length - 1 - depth] as number];
}

/** Valid when the last K lights are distinct cells, or the n-back light is not the last cell. */
function isClear(content: WorkingGridContent): boolean {
  const { stream, depth, kind } = content;
  if (stream.length <= depth) return false;
  if (kind === 'last-k') return new Set(stream.slice(-depth)).size === depth;
  return stream[stream.length - 1 - depth] !== stream.at(-1);
}

const steps = (n: number) =>
  n === 1 ? 'just before the last one' : `${n} steps before the last one`;

export const WORKING_MEMORY_GRID_ID = gameIdOf('working-memory-grid');

export const workingMemoryGridGame: GameDefinition<WorkingGridChallenge, WorkingGridProfile> = {
  id: WORKING_MEMORY_GRID_ID,
  name: 'Working Memory Grid',
  tagline: 'Keep track of the latest lights.',
  description:
    'Lights appear one at a time on a grid, and you do not know how many will come. Keep the most recent ones in mind and update as each new light appears: then mark the last few, or point at the one a few steps back.',
  area: 'memory',
  skills: ['working-memory', 'spatial-reasoning', 'sustained-attention'],
  meta: {
    category: 'memory',
    audiences: ['teens', 'adults', 'seniors', 'programmers'],
    interaction: 'grid',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'An answer counts when you mark exactly the last lights asked for, or point at the right earlier light. Your result is the share of streams answered correctly; answering is not timed.',
    feedback: 'brief',
  },
  instructions: [
    'Watch the lights. Each new one pushes the oldest out of what you need to keep.',
    'The stream length changes, so keep updating until it stops.',
    'Then answer: mark the last few lights, or point at the light a set number of steps before the last.',
    'Keyboard: arrow keys move between cells, Enter chooses or marks one.',
  ],
  simpleInstructions: 'Watch the lights and remember the last ones.',
  levels: WORKING_GRID_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    const depth = kind === 'last-k' ? profile.lastK : profile.nBack;
    const cells = profile.size * profile.size;
    const length = randomInt(random, profile.stream[0], profile.stream[1]);
    const content = retryGeneration('clear light stream', () => {
      const candidate: WorkingGridContent = {
        kind,
        size: profile.size,
        stream: streamOf(random, cells, length),
        depth,
        itemMs: profile.itemMs,
      };
      return isClear(candidate) ? candidate : null;
    });
    const answer = solve(content);
    const names = answer.map((i) => cellName(i, profile.size));
    return {
      ...identity,
      prompt:
        kind === 'last-k'
          ? `Mark the cells of the last ${depth} lights.`
          : `Where was the light ${steps(depth)}?`,
      studyPrompt:
        kind === 'last-k'
          ? `Keep the last ${depth} lights in mind.`
          : `Watch the lights: you will be asked about the one ${steps(depth)}.`,
      content,
      response:
        kind === 'last-k'
          ? multiSelectResponse(cells, answer)
          : locateResponse(cells, answer[0] as number),
      explanation:
        kind === 'last-k'
          ? `There were ${length} lights; the last ${depth} were at ${names.join('; ')}.`
          : `There were ${length} lights; the one ${steps(depth)} was at ${names[0] ?? ''}.`,
      skills: ['working-memory', 'spatial-reasoning'],
      timing: untimed(profile.timing.targetMs, length * profile.itemMs + 1000),
    };
  },
};
