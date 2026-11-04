import { numericResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
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
  name: msg('attention:symbolCounting.name'),
  tagline: msg('attention:symbolCounting.tagline'),
  description: msg('attention:symbolCounting.description'),
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
    scoringSummary: msg('attention:symbolCounting.scoringSummary'),
    feedback: 'brief',
    accessibilityNotes: msg('attention:symbolCounting.accessibilityNotes'),
  },
  instructions: [
    msg('attention:symbolCounting.instructions.1'),
    msg('attention:symbolCounting.instructions.2'),
    msg('attention:symbolCounting.instructions.3'),
    msg('attention:symbolCounting.instructions.4'),
  ],
  simpleInstructions: msg('attention:symbolCounting.simpleInstructions'),
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
      prompt: msg('attention:symbolCounting.prompt', { mark: markLabel(target) }),
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
      explanation: msg('attention:symbolCounting.explanation', {
        count: answer,
        mark: markLabel(target),
      }),
      skills: ['concentration', 'selective-attention'],
      timing: profile.timing,
    };
  },
};
