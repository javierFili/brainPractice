import { locateResponse, multiSelectResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { randomInt, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg } from '@/domain/shared';
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

/** "just before the last one", "2 steps before the last one". */
const steps = (n: number) => msg('memory:workingMemoryGrid.steps', { count: n });

export const WORKING_MEMORY_GRID_ID = gameIdOf('working-memory-grid');

export const workingMemoryGridGame: GameDefinition<WorkingGridChallenge, WorkingGridProfile> = {
  id: WORKING_MEMORY_GRID_ID,
  name: msg('memory:workingMemoryGrid.name'),
  tagline: msg('memory:workingMemoryGrid.tagline'),
  description: msg('memory:workingMemoryGrid.description'),
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
    scoringSummary: msg('memory:workingMemoryGrid.scoringSummary'),
    feedback: 'brief',
  },
  instructions: [
    msg('memory:workingMemoryGrid.instructions.watch'),
    msg('memory:workingMemoryGrid.instructions.update'),
    msg('memory:workingMemoryGrid.instructions.answer'),
    msg('memory:workingMemoryGrid.instructions.keyboard'),
  ],
  simpleInstructions: msg('memory:workingMemoryGrid.simpleInstructions'),
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
          ? msg('memory:workingMemoryGrid.prompt.lastK', { count: depth })
          : msg('memory:workingMemoryGrid.prompt.nBack', { steps: steps(depth) }),
      studyPrompt:
        kind === 'last-k'
          ? msg('memory:workingMemoryGrid.studyPrompt.lastK', { count: depth })
          : msg('memory:workingMemoryGrid.studyPrompt.nBack', { steps: steps(depth) }),
      content,
      response:
        kind === 'last-k'
          ? multiSelectResponse(cells, answer)
          : locateResponse(cells, answer[0] as number),
      explanation:
        kind === 'last-k'
          ? msg('memory:workingMemoryGrid.explanation.lastK', {
              length,
              count: depth,
              cells: joinText(names, '; '),
            })
          : msg('memory:workingMemoryGrid.explanation.nBack', {
              length,
              steps: steps(depth),
              cell: names[0] ?? '',
            }),
      skills: ['working-memory', 'spatial-reasoning'],
      timing: untimed(profile.timing.targetMs, length * profile.itemMs + 1000),
    };
  },
};
