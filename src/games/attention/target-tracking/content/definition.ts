import { locateResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, sample } from '@/domain/random';
import { gameIdOf, joinText, msg } from '@/domain/shared';
import { distinctGlyphs } from '@/games/kit/content';
import { mark, markLabel, type Mark } from '../../shared/content';
import { REVEAL_MS, TARGET_TRACKING_LEVELS } from './levels';
import type { Swap, TargetTrackingChallenge, TargetTrackingProfile } from './types';

export const TARGET_TRACKING_ID = gameIdOf('target-tracking');

/** Positions visited by the card that starts at `start`, including the start. */
export function pathOf(start: number, swaps: readonly Swap[]): number[] {
  const path = [start];
  let at = start;
  for (const [a, b] of swaps) {
    if (at === a) at = b;
    else if (at === b) at = a;
    else continue;
    path.push(at);
  }
  return path;
}

export const finalPosition = (start: number, swaps: readonly Swap[]) =>
  pathOf(start, swaps).at(-1) ?? start;

/** The card in each position after the first `done` swaps. */
export function arrangementAfter(
  slots: number,
  swaps: readonly Swap[],
  done = swaps.length,
): number[] {
  const order = Array.from({ length: slots }, (_, i) => i);
  for (const [a, b] of swaps.slice(0, done))
    [order[a], order[b]] = [order[b] as number, order[a] as number];
  return order;
}

export const targetTrackingGame: GameDefinition<TargetTrackingChallenge, TargetTrackingProfile> = {
  id: TARGET_TRACKING_ID,
  name: msg('attention:targetTracking.name'),
  tagline: msg('attention:targetTracking.tagline'),
  description: msg('attention:targetTracking.description'),
  area: 'attention',
  skills: ['sustained-attention', 'concentration', 'spatial-reasoning'],
  meta: {
    category: 'attention',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'grid',
    estimatedMinutes: 3,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('attention:targetTracking.scoringSummary'),
    feedback: 'brief',
    accessibilityNotes: msg('attention:targetTracking.accessibilityNotes'),
  },
  instructions: [
    msg('attention:targetTracking.instructions.1'),
    msg('attention:targetTracking.instructions.2'),
    msg('attention:targetTracking.instructions.3'),
    msg('attention:targetTracking.instructions.4'),
  ],
  simpleInstructions: msg('attention:targetTracking.simpleInstructions'),
  levels: TARGET_TRACKING_LEVELS,
  generate({ identity, profile, random }) {
    const followCount = profile.kind === 'double' ? 2 : 1;
    const draft = retryGeneration('a swap sequence', () => {
      const swaps: Swap[] = Array.from({ length: profile.swaps }, () => {
        const [a, b] = sample(
          random,
          Array.from({ length: profile.slots }, (_, i) => i),
          2,
        ) as [number, number];
        return [Math.min(a, b), Math.max(a, b)] as const;
      });
      const followed = sample(
        random,
        Array.from({ length: profile.slots }, (_, i) => i),
        followCount,
      ).sort((a, b) => a - b);
      const asked = pick(random, followed);
      // Every followed card must really travel, and the asked card must not end where it began.
      const moves = followed.map((start) => pathOf(start, swaps).length - 1);
      if (moves.some((n) => n < Math.ceil(profile.swaps / 3))) return null;
      if (finalPosition(asked, swaps) === asked) return null;
      // No swap repeated back-to-back (it would undo itself and look like a glitch).
      for (let i = 1; i < swaps.length; i++) {
        const prev = swaps[i - 1] as Swap;
        const cur = swaps[i] as Swap;
        if (prev[0] === cur[0] && prev[1] === cur[1]) return null;
      }
      return { swaps, followed, asked };
    });
    const items: Mark[] = distinctGlyphs(random, profile.slots).map((g) => mark(g.shape, g.color));
    const askedItem = items[draft.asked] as Mark;
    const answer = finalPosition(draft.asked, draft.swaps);
    const path = pathOf(draft.asked, draft.swaps).map((p) => String(p + 1));
    return {
      ...identity,
      prompt: msg(`attention:targetTracking.prompt.${profile.kind}`),
      content: {
        kind: profile.kind,
        items,
        followed: draft.followed,
        asked: draft.asked,
        swaps: draft.swaps,
        stepMs: profile.stepMs,
        revealMs: REVEAL_MS,
      },
      response: locateResponse(profile.slots, answer),
      explanation: msg('attention:targetTracking.explanation', {
        item: markLabel(askedItem),
        path: joinText(path, ' → '),
        position: answer + 1,
      }),
      skills:
        profile.kind === 'single'
          ? ['sustained-attention', 'spatial-reasoning']
          : ['sustained-attention', 'concentration'],
      timing: profile.timing,
    };
  },
};
