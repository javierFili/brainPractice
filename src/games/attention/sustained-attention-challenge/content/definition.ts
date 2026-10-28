import { multiSelectResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, sample } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { SUSTAINED_ATTENTION_LEVELS } from './levels';
import type {
  SustainedAttentionChallenge,
  SustainedAttentionContent,
  SustainedAttentionProfile,
} from './types';

export const SUSTAINED_ATTENTION_ID = gameIdOf('sustained-attention-challenge');

export const TARGET = 'X';
export const CUE = 'A';
const FILLERS = Array.from('BCDEFGHJLMNPRSTUZ');
const LOOKALIKES = Array.from('KYV');

/** Stream positions the player should press. */
export function targetPositions(
  content: Pick<SustainedAttentionContent, 'stream' | 'target' | 'cue'>,
): number[] {
  return content.stream.flatMap((letter, i) =>
    letter === content.target && (content.cue === null || content.stream[i - 1] === content.cue)
      ? [i]
      : [],
  );
}

function build(
  random: Parameters<typeof pick>[0],
  profile: SustainedAttentionProfile,
): string[] | null {
  const { length, targets, lures, kind } = profile;
  const stream: (string | null)[] = Array.from({ length }, () => null);
  const slots = Array.from({ length }, (_, i) => i);
  const free = (i: number) => i >= 0 && i < length && stream[i] === null;
  // Targets (and their cues) first, at non-touching positions.
  for (const i of sample(random, slots.slice(kind === 'sequence' ? 1 : 0), length - 1)) {
    if (stream.filter((c) => c === TARGET).length >= targets) break;
    if (
      kind === 'single'
        ? free(i) && stream[i - 1] !== TARGET && stream[i + 1] !== TARGET
        : free(i) && free(i - 1)
    ) {
      stream[i] = TARGET;
      if (kind === 'sequence') stream[i - 1] = CUE;
    }
  }
  // Lures: look-alikes (single) or broken pairs: a lone X, or an A not followed by X (sequence).
  let placed = 0;
  for (const i of sample(random, slots, length)) {
    if (placed >= lures) break;
    if (!free(i)) continue;
    // In sequence streams at least every other lure is a broken pair (lone X or lone A).
    const pairLures = [TARGET, CUE];
    const letter =
      kind === 'single'
        ? pick(random, LOOKALIKES)
        : pick(
            random,
            profile.lookalikes && placed % 2 === 1 ? [...pairLures, ...LOOKALIKES] : pairLures,
          );
    if (letter === TARGET && stream[i - 1] === CUE) continue;
    if (letter === CUE && stream[i + 1] === TARGET) continue;
    if (stream[i - 1] === letter || stream[i + 1] === letter) continue;
    stream[i] = letter;
    placed++;
  }
  const fillers = profile.lookalikes && kind === 'single' ? [...FILLERS, ...LOOKALIKES] : FILLERS;
  for (let i = 0; i < length; i++) {
    if (stream[i] !== null) continue;
    const options = fillers.filter((l) => l !== stream[i - 1] && l !== stream[i + 1]);
    stream[i] = pick(random, options);
  }
  const letters = stream as string[];
  if (letters.some((l, i) => i > 0 && l === letters[i - 1])) return null;
  return letters;
}

export const sustainedAttentionGame: GameDefinition<
  SustainedAttentionChallenge,
  SustainedAttentionProfile
> = {
  id: SUSTAINED_ATTENTION_ID,
  name: 'Sustained Attention Challenge',
  tagline: 'Stay with the stream.',
  description:
    'Letters appear one at a time at a steady pace. Press “Now!” (or Space) each time the target appears — later, only when an X comes right after an A. Streams grow from 15 to 45 letters.',
  area: 'attention',
  skills: ['sustained-attention', 'concentration', 'selective-attention'],
  meta: {
    category: 'attention',
    audiences: ['teens', 'adults', 'seniors'],
    interaction: 'tap',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'Each stream is scored on misses plus wrong presses; it counts as correct when that total is within the stated tolerance (0 to 2, depending on the level). Your result is the share of streams within tolerance.',
    feedback: 'brief',
    accessibilityNotes:
      'Letters change at a fixed pace (0.8–1.5 s each, 50% slower in relaxed mode) and are announced to screen readers; nothing flashes. A press counts for the letter on screen at that moment.',
  },
  instructions: [
    'Letters appear one at a time in the box. Keep watching until the stream ends.',
    'Press “Now!” or Space while the target letter is on screen.',
    'From level 5: press only for an X that comes right after an A.',
    'The stream submits itself at the end. A press counts for the letter shown at that moment.',
  ],
  simpleInstructions: 'Press the button every time you see the X.',
  levels: SUSTAINED_ATTENTION_LEVELS,
  generate({ identity, profile, random }) {
    const cue = profile.kind === 'sequence' ? CUE : null;
    const stream = retryGeneration('a letter stream', () => {
      const letters = build(random, profile);
      if (letters === null) return null;
      return targetPositions({ stream: letters, target: TARGET, cue }).length === profile.targets
        ? letters
        : null;
    });
    const solution = targetPositions({ stream, target: TARGET, cue });
    const rule = cue === null ? `every ${TARGET}` : `an ${TARGET} right after an ${cue}`;
    return {
      ...identity,
      prompt: `Press “Now!” for ${rule}.${profile.maxErrors > 0 ? ` Up to ${profile.maxErrors} ${profile.maxErrors === 1 ? 'slip is' : 'slips are'} allowed.` : ''}`,
      content: { kind: profile.kind, stream, target: TARGET, cue, itemMs: profile.itemMs },
      response: multiSelectResponse(stream.length, solution, {
        exact: false,
        maxErrors: profile.maxErrors,
      }),
      explanation: `There were ${solution.length} targets, at positions ${solution.map((i) => i + 1).join(', ')}.`,
      skills:
        profile.kind === 'single'
          ? ['sustained-attention', 'concentration']
          : ['sustained-attention', 'selective-attention'],
      timing: profile.timing,
    };
  },
};
