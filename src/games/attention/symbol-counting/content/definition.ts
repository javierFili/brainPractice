import { numericResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { SHAPES } from '@/games/kit/content';
import {
  ROTATIONS,
  TURNING_SHAPES,
  changeMark,
  countWhere,
  mark,
  markLabel,
  randomColor,
  sameLook,
  type Mark,
} from '../../shared/content';
import { SYMBOL_COUNTING_LEVELS } from './levels';
import type { SymbolCountingChallenge, SymbolCountingProfile } from './types';

export const SYMBOL_COUNTING_ID = gameIdOf('symbol-counting');

function targetFor(random: RandomGenerator, profile: SymbolCountingProfile): Mark {
  const color = randomColor(random);
  if (profile.lures.includes('mirror'))
    return mark('ell', color, pick(random, ROTATIONS), chance(random, 0.5));
  if (profile.lures.includes('turn'))
    return mark(
      pick(
        random,
        TURNING_SHAPES.filter((s) => s !== 'ell'),
      ),
      color,
      pick(random, ROTATIONS),
    );
  return mark(pick(random, SHAPES), color);
}

/** A filler that differs from the target in every feature (shape and colour). */
function unrelated(random: RandomGenerator, target: Mark): Mark {
  const shape = pick(
    random,
    SHAPES.filter((s) => s !== target.shape),
  );
  return mark(shape, randomColor(random, [target.color]), pick(random, ROTATIONS));
}

export const symbolCountingGame: GameDefinition<SymbolCountingChallenge, SymbolCountingProfile> = {
  id: SYMBOL_COUNTING_ID,
  name: 'Symbol Counting',
  tagline: 'How many are there — exactly?',
  description:
    'Count how many times one symbol appears in a field of shapes. Look-alikes that differ only in colour, outline, direction or mirroring must not be counted. Fields grow to 48 items.',
  area: 'attention',
  skills: ['concentration', 'selective-attention', 'sustained-attention'],
  meta: {
    category: 'attention',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'numeric',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'A field counts as correct when your number is exactly right. Your result is the share of fields counted exactly; answering is not timed.',
    feedback: 'brief',
    accessibilityNotes:
      'Some look-alikes differ only in colour. The field is also a list of named items ("blue triangle, turned left"), so a screen reader can count by name.',
  },
  instructions: [
    'The symbol to count is shown above the field.',
    'Count every exact copy: same shape, same colour, same direction.',
    'Look-alikes do not count. Type the number and press Enter.',
    'Tip: go row by row so you do not count anything twice.',
  ],
  simpleInstructions: 'Count how many times you see the symbol at the top.',
  levels: SYMBOL_COUNTING_LEVELS,
  generate({ identity, profile, random }) {
    const cells = profile.columns * profile.rows;
    const { items, target } = retryGeneration('a counting field', () => {
      const t = targetFor(random, profile);
      const n = randomInt(random, profile.minTargets, profile.maxTargets);
      const spots = new Set(
        sample(
          random,
          Array.from({ length: cells }, (_, i) => i),
          n,
        ),
      );
      const field: Mark[] = [];
      for (let i = 0; i < cells; i++) {
        if (spots.has(i)) {
          field.push(t);
          continue;
        }
        const lure =
          profile.lures.length > 0 && chance(random, profile.lureShare)
            ? changeMark(random, t, pick(random, profile.lures), profile.subtle)
            : null;
        field.push(lure ?? unrelated(random, t));
      }
      if (countWhere(field, (m) => sameLook(m, t)) !== n) return null;
      return { items: field, target: t };
    });
    const answer = countWhere(items, (m) => sameLook(m, target));
    return {
      ...identity,
      prompt: `How many ${markLabel(target)} symbols are there?`,
      content: {
        kind:
          profile.lures.length === 0
            ? 'plain'
            : profile.lures.some((l) => l === 'turn' || l === 'mirror')
              ? 'oriented'
              : 'lookalike',
        columns: profile.columns,
        items,
        target,
      },
      response: numericResponse(answer),
      explanation: `There ${answer === 1 ? 'is' : 'are'} ${answer} exact ${answer === 1 ? 'copy' : 'copies'} of the ${markLabel(target)} (highlighted).`,
      skills: ['concentration', 'selective-attention'],
      timing: profile.timing,
    };
  },
};
