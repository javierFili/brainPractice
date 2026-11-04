import type { GameDefinition } from '@/domain/game';
import { chance, pick, randomInt } from '@/domain/random';
import { gameIdOf, msg, type Message } from '@/domain/shared';
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

export const directionLabel = (d: Direction): Message =>
  msg(`speed:multiChoiceProcessing.directions.${d}`);

/** "left" as in "pointed left" (each language words the direction its own way). */
const pointing = (d: Direction): Message => msg(`speed:multiChoiceProcessing.pointing.${d}`);

export const directionsOf = (count: 2 | 4): readonly Direction[] => DIRECTIONS.slice(0, count);

export const MULTI_CHOICE_PROCESSING_ID = gameIdOf('multi-choice-processing');

export const multiChoiceProcessingGame: GameDefinition<FlankerChallenge, FlankerProfile> = {
  id: MULTI_CHOICE_PROCESSING_ID,
  name: msg('speed:multiChoiceProcessing.name'),
  tagline: msg('speed:multiChoiceProcessing.tagline'),
  description: msg('speed:multiChoiceProcessing.description'),
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
    scoringSummary: msg('speed:multiChoiceProcessing.scoringSummary'),
    feedback: 'brief',
    accessibilityNotes: msg('speed:multiChoiceProcessing.accessibilityNotes'),
  },
  instructions: [
    msg('speed:multiChoiceProcessing.instructions.centre'),
    msg('speed:multiChoiceProcessing.instructions.ignore'),
    msg('speed:multiChoiceProcessing.instructions.vertical'),
    msg('speed:multiChoiceProcessing.instructions.cue'),
  ],
  simpleInstructions: msg('speed:multiChoiceProcessing.simpleInstructions'),
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
    return {
      ...identity,
      prompt: msg(
        `speed:multiChoiceProcessing.prompt.${profile.kind === 'single' ? 'single' : rule}`,
      ),
      content: { kind: profile.kind, rule, row, congruence, track, start },
      response: fixedChoice(directions.map(directionLabel), answerIndex),
      explanation: msg(
        `speed:multiChoiceProcessing.explanation.${profile.kind === 'single' ? 'single' : rule}${conflict ? 'Conflict' : ''}`,
        { direction: pointing(answer), other: pointing(other) },
      ),
      skills:
        profile.kind === 'cued'
          ? ['selective-attention', 'cognitive-flexibility', 'processing-speed']
          : ['selective-attention', 'processing-speed'],
      timing: profile.timing,
    };
  },
};
