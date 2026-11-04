import { locateResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, type RandomGenerator } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
import { SHAPES } from '@/games/kit/content';
import {
  ROTATIONS,
  TURNING_SHAPES,
  cellName,
  changeMark,
  mark,
  markKey,
  markLabel,
  randomColor,
  type Change,
  type Mark,
} from '../../shared/content';
import { ODD_ONE_OUT_LEVELS } from './levels';
import type { OddOneOutChallenge, OddOneOutContent, OddOneOutProfile } from './types';

export const ODD_ONE_OUT_ID = gameIdOf('odd-one-out');

/** A base mark that can show `change` (turns need a pointing shape, mirroring the L). */
function baseFor(random: RandomGenerator, change: Change): Mark {
  const color = randomColor(random);
  switch (change) {
    case 'color':
    case 'shape':
      return mark(pick(random, SHAPES), color);
    case 'turn':
      return mark(
        pick(random, TURNING_SHAPES),
        color,
        pick(random, ROTATIONS),
        random.next() < 0.5,
      );
    case 'mirror':
      return mark('ell', color, pick(random, ROTATIONS), random.next() < 0.5);
  }
}

/** Index of the only item whose look differs from all others; null if there is not exactly one. */
export function findOddOne(items: readonly Mark[]): number | null {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(markKey(item), (counts.get(markKey(item)) ?? 0) + 1);
  if (counts.size !== 2 || items.length < 3) return null;
  const odd = [...counts].find(([, n]) => n === 1);
  return odd === undefined ? null : items.findIndex((item) => markKey(item) === odd[0]);
}

export const oddOneOutGame: GameDefinition<OddOneOutChallenge, OddOneOutProfile> = {
  id: ODD_ONE_OUT_ID,
  name: msg('attention:oddOneOut.name'),
  tagline: msg('attention:oddOneOut.tagline'),
  description: msg('attention:oddOneOut.description'),
  area: 'attention',
  skills: ['selective-attention', 'concentration', 'visual-orientation'],
  meta: {
    category: 'attention',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'grid',
    estimatedMinutes: 3,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('attention:oddOneOut.scoringSummary'),
    feedback: 'brief',
    accessibilityNotes: msg('attention:oddOneOut.accessibilityNotes'),
  },
  instructions: [
    msg('attention:oddOneOut.instructions.1'),
    msg('attention:oddOneOut.instructions.2'),
    msg('attention:oddOneOut.instructions.3'),
    msg('attention:oddOneOut.instructions.4'),
  ],
  simpleInstructions: msg('attention:oddOneOut.simpleInstructions'),
  levels: ODD_ONE_OUT_LEVELS,
  generate({ identity, profile, random }) {
    const count = profile.columns * profile.rows;
    const { content, odd } = retryGeneration('an odd-one-out grid', () => {
      const change = pick(random, profile.changes);
      const base = baseFor(random, change);
      const different = changeMark(random, base, change, profile.subtle);
      if (different === null) return null;
      const position = randomInt(random, 0, count - 1);
      const items = Array.from({ length: count }, (_, i) => (i === position ? different : base));
      if (findOddOne(items) !== position) return null;
      const result: OddOneOutContent = { kind: change, columns: profile.columns, items };
      return { content: result, odd: position };
    });
    const base = content.items[odd === 0 ? 1 : 0] as Mark;
    const different = content.items[odd] as Mark;
    return {
      ...identity,
      prompt: msg('attention:oddOneOut.prompt'),
      content,
      response: locateResponse(count, odd),
      explanation: msg('attention:oddOneOut.explanation', {
        cell: cellName(odd, profile.columns),
        odd: markLabel(different),
        base: markLabel(base),
        feature: msg(`attention:oddOneOut.feature.${content.kind}`),
      }),
      skills:
        content.kind === 'turn' || content.kind === 'mirror'
          ? ['selective-attention', 'visual-orientation']
          : ['selective-attention', 'concentration'],
      timing: profile.timing,
    };
  },
};
