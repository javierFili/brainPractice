import type { GameDefinition } from '@/domain/game';
import { chance, pick, randomInt } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { SPEED_SCORING, fixedChoice } from '@/games/speed/shared/content';
import { FLANKER_LEVELS } from './levels';
import {
  DIRECTIONS,
  type Congruence,
  type Direction,
  type FlankerChallenge,
  type FlankerProfile,
  type FlankerRule,
  type RowItem,
} from './types';

export const directionLabel = (d: Direction) => d.charAt(0).toUpperCase() + d.slice(1);

export const directionsOf = (count: 2 | 4): readonly Direction[] => DIRECTIONS.slice(0, count);

export const MULTI_CHOICE_PROCESSING_ID = gameIdOf('multi-choice-processing');

export const multiChoiceProcessingGame: GameDefinition<FlankerChallenge, FlankerProfile> = {
  id: MULTI_CHOICE_PROCESSING_ID,
  name: 'Multi-Choice Processing Challenge',
  tagline: 'Ignore the crowd: which way does the centre point?',
  description:
    'A row of arrows appears. Answer the direction of the centre arrow while the arrows around it point the same way, another way, or nowhere. Later levels add up and down, longer rows and a cue that sometimes asks for the outer arrows instead.',
  area: 'speed',
  skills: ['selective-attention', 'processing-speed', 'cognitive-flexibility'],
  meta: {
    category: 'speed',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 2,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time'],
    scoringSummary:
      'Each answer is right or wrong; a wrong answer costs points. A correct answer earns more the faster it comes, but accuracy carries most of the result. Relaxed timing removes the time limit; the conflict between arrows still has to be resolved.',
    feedback: 'brief',
    accessibilityNotes:
      'Directions are given by arrow shape, never by colour. Screen readers announce the row as a list of directions; the visual conflict that makes the task hard is mostly lost when listening.',
  },
  instructions: [
    'Look at the arrow in the middle of the row and answer its direction (click or number keys).',
    'Ignore the arrows around it — they may point another way.',
    'From level 5 arrows can also point up or down.',
    'From level 7 a cue says CENTRE (the middle arrow) or OUTER (the arrows around it).',
  ],
  simpleInstructions: 'Which way does the middle arrow point?',
  levels: FLANKER_LEVELS,
  scoring: SPEED_SCORING,
  generate({ identity, profile, random }) {
    const directions = directionsOf(profile.directionCount);
    const answerIndex = randomInt(random, 0, directions.length - 1);
    const answer = directions[answerIndex] as Direction;
    const rule: FlankerRule =
      profile.kind === 'cued' && chance(random, profile.outerShare) ? 'outer' : 'centre';
    const conflict = profile.kind !== 'single' && chance(random, profile.incongruentShare);
    const neutral =
      !conflict &&
      rule === 'centre' &&
      profile.kind !== 'single' &&
      chance(random, profile.neutralShare);
    const congruence: Congruence = conflict ? 'incongruent' : neutral ? 'neutral' : 'congruent';
    const other = conflict
      ? pick(
          random,
          directions.filter((d) => d !== answer),
        )
      : answer;
    // The answered element gets `answer`; the other role gets `other` (or bars).
    const centre: Direction = rule === 'centre' ? answer : other;
    const flank: RowItem = neutral ? 'none' : rule === 'centre' ? other : answer;
    const middle = Math.floor(profile.rowLength / 2);
    const row: RowItem[] = Array.from({ length: profile.rowLength }, (_, i) =>
      i === middle ? centre : flank,
    );
    // Up to 2 slots of jitter each way, within 7 slots (fits a 360 px screen).
    const jitter = Math.min(2, Math.floor((7 - profile.rowLength) / 2));
    const track = profile.rowLength + 2 * jitter;
    const start = randomInt(random, 0, 2 * jitter);
    const target = rule === 'centre' ? 'centre arrow' : 'outer arrows';
    return {
      ...identity,
      prompt:
        rule === 'centre'
          ? profile.kind === 'single'
            ? 'Which way does the arrow point?'
            : 'Which way does the centre arrow point?'
          : 'Which way do the outer arrows point?',
      content: { kind: profile.kind, rule, row, congruence, track, start },
      response: fixedChoice(directions.map(directionLabel), answerIndex),
      explanation:
        profile.kind === 'single'
          ? `The arrow pointed ${answer}.`
          : `The ${target} pointed ${answer}${conflict ? `; the ${rule === 'centre' ? 'outer arrows' : 'centre arrow'} pointed ${other}` : ''}.`,
      skills:
        profile.kind === 'cued'
          ? ['selective-attention', 'cognitive-flexibility', 'processing-speed']
          : ['selective-attention', 'processing-speed'],
      timing: profile.timing,
    };
  },
};
