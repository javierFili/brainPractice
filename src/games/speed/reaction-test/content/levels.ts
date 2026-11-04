import { msg, type Text } from '@/domain/shared';
import { defineLevels } from '@/games/kit/content';
import type { ReactionProfile } from './types';

/** limitMs is a safety net; the stage itself closes the trial when the window ends. */
const timing = ([, max]: readonly [number, number], windowMs: number) => ({
  studyMs: null,
  limitMs: max + windowMs + 2000,
  targetMs: max + windowMs,
});

const row = (
  objective: Text,
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
  row(msg('speed:reactionTest.levels.1'), 'simple', [1000, 2500], 1500, 0, false, 8),
  row(msg('speed:reactionTest.levels.2'), 'simple', [900, 2800], 1200, 0, false, 10),
  row(msg('speed:reactionTest.levels.3'), 'simple', [700, 3200], 1000, 0, false, 10),
  row(msg('speed:reactionTest.levels.4'), 'go-no-go', [900, 2800], 1100, 0.2, false, 12),
  row(msg('speed:reactionTest.levels.5'), 'go-no-go', [800, 2800], 1000, 0.3, false, 12),
  row(msg('speed:reactionTest.levels.6'), 'go-no-go', [800, 3000], 1000, 0.3, true, 12),
  row(msg('speed:reactionTest.levels.7'), 'cued', [900, 3000], 1100, 0.35, false, 12),
  row(msg('speed:reactionTest.levels.8'), 'cued', [900, 3000], 1000, 0.35, true, 14),
  row(msg('speed:reactionTest.levels.9'), 'cued', [800, 3200], 900, 0.4, true, 14),
  row(msg('speed:reactionTest.levels.10'), 'cued', [600, 3600], 800, 0.4, true, 16),
]);
