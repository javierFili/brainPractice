import { defineLevels } from '@/games/kit/content';
import type { ReactionProfile } from './types';

/** limitMs is a safety net; the stage itself closes the trial when the window ends. */
const timing = ([, max]: readonly [number, number], windowMs: number) => ({
  studyMs: null,
  limitMs: max + windowMs + 2000,
  targetMs: max + windowMs,
});

const row = (
  objective: string,
  kind: ReactionProfile['kind'],
  delayMs: readonly [number, number],
  windowMs: number,
  noGoShare: number,
  similarNoGo: boolean,
  challengeCount: number,
) => ({
  objective,
  kind,
  delayMs,
  windowMs,
  noGoShare,
  similarNoGo,
  challengeCount,
  timing: timing(delayMs, windowMs),
});

/**
 * From a plain reaction (one rule, generous window) to a cued go/no-go decision with look-alike
 * stimuli and a short window. Unpredictable waits keep anticipation from paying off.
 */
export const REACTION_LEVELS = defineLevels<ReactionProfile>([
  row('Tap when the shape appears.', 'simple', [1000, 2500], 1500, 0, false, 8),
  row('Tap faster: the shape stays a little less.', 'simple', [900, 2800], 1200, 0, false, 10),
  row('Unpredictable waits: do not tap early.', 'simple', [700, 3200], 1000, 0, false, 10),
  row(
    'Tap only for the go shape (1 in 5 is a stop shape).',
    'go-no-go',
    [900, 2800],
    1100,
    0.2,
    false,
    12,
  ),
  row(
    'More stop shapes: hold back when it is not the go shape.',
    'go-no-go',
    [800, 2800],
    1000,
    0.3,
    false,
    12,
  ),
  row('Stop shapes now look like the go shape.', 'go-no-go', [800, 3000], 1000, 0.3, true, 12),
  row(
    'Follow the cue: the go shape changes every trial.',
    'cued',
    [900, 3000],
    1100,
    0.35,
    false,
    12,
  ),
  row('Cued trials with look-alike shapes.', 'cued', [900, 3000], 1000, 0.35, true, 14),
  row('Cued look-alikes, shorter window.', 'cued', [800, 3200], 900, 0.4, true, 14),
  row(
    'Master: cued look-alikes, short window, long unpredictable waits.',
    'cued',
    [600, 3600],
    800,
    0.4,
    true,
    16,
  ),
]);
