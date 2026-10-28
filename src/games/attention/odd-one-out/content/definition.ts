import { locateResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
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

const CHANGE_WORDS: Record<Change, string> = {
  color: 'colour',
  shape: 'shape',
  turn: 'orientation',
  mirror: 'mirroring',
};

export const oddOneOutGame: GameDefinition<OddOneOutChallenge, OddOneOutProfile> = {
  id: ODD_ONE_OUT_ID,
  name: 'Odd One Out',
  tagline: 'All the same… except one.',
  description:
    'A grid of identical shapes hides exactly one that is different. Find it. The difference starts as a clear colour change and becomes a similar outline, a turned shape or a mirrored L in bigger grids.',
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
    scoringSummary:
      'A grid counts as correct when you point at the one different shape. Your result is the share of grids solved; answering is not timed.',
    feedback: 'brief',
    accessibilityNotes:
      'Levels 1, 2 and 6 differ only in colour; every cell is also named (e.g. "red circle"), so screen readers can compare names. Orientation levels name the pose ("turned right", "mirrored").',
  },
  instructions: [
    'Every shape in the grid looks the same except one.',
    'Find the different one and press it. There is always exactly one.',
    'It may differ in colour, outline, which way it points, or be mirrored.',
    'Keyboard: arrow keys move between cells, Enter chooses.',
  ],
  simpleInstructions: 'Find the one shape that is different and tap it.',
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
      prompt: 'Find the one shape that is different.',
      content,
      response: locateResponse(count, odd),
      explanation: `At ${cellName(odd, profile.columns)}: a ${markLabel(different)} among ${markLabel(base)}s — it differs in ${CHANGE_WORDS[content.kind]}.`,
      skills:
        content.kind === 'turn' || content.kind === 'mirror'
          ? ['selective-attention', 'visual-orientation']
          : ['selective-attention', 'concentration'],
      timing: profile.timing,
    };
  },
};
