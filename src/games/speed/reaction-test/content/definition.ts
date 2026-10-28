import { tapResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { chance, pick, randomInt } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { ALL_GLYPHS, distinctGlyphs, glyphLabel, nearGlyph, type Glyph } from '@/games/kit/content';
import { REACTION_LEVELS } from './levels';
import type { ReactionChallenge, ReactionProfile } from './types';

/** Fixed go/stop shapes for non-cued levels, so the rule is learnt once per session. */
export const GO_GLYPH: Glyph = { shape: 'circle', color: 'green' };
const STOP_GLYPH: Glyph = { shape: 'square', color: 'red' };

export const REACTION_TEST_ID = gameIdOf('reaction-test');

export const reactionTestGame: GameDefinition<ReactionChallenge, ReactionProfile> = {
  id: REACTION_TEST_ID,
  name: 'Reaction Test',
  tagline: 'Wait for it… now!',
  description:
    'Wait for a shape to appear and tap as fast as you can. Later levels add stop shapes that must not be tapped, and a cue that changes the go shape on every trial — speed only counts when the decision is right.',
  area: 'speed',
  skills: ['reaction-time', 'processing-speed', 'selective-attention'],
  meta: {
    category: 'speed',
    audiences: ['kids', 'teens', 'adults', 'programmers'],
    interaction: 'tap',
    estimatedMinutes: 2,
    keyboard: 'full',
    relaxedFriendly: false,
    measures: ['accuracy', 'reaction-time'],
    scoringSummary:
      'A trial is correct when you tap during the signal on a go trial, or hold back on a stop trial. Taps before the signal are false starts. Reaction time (signal to tap) is reported separately from accuracy.',
    feedback: 'brief',
    accessibilityNotes:
      'Needs a quick response; relaxed timing does not lengthen the signal. Works with Space, Enter, a click, a tap or a switch mapped to Space.',
  },
  instructions: [
    'Keep your eyes on the box. After a random wait, a shape appears.',
    'Tap the box (or press Space) while the shape is visible. Tapping before it appears is a false start.',
    'From level 4: tap only for the go shape (green circle) and hold back for the stop shape.',
    'From level 7: a cue at the top shows which shape to tap for — it changes on every trial.',
  ],
  simpleInstructions: 'When the shape appears, tap as fast as you can.',
  levels: REACTION_LEVELS,
  scoring: { maxSpeedBonus: 0.25, accuracyWeight: 0.85 },
  generate({ identity, profile, random }) {
    const delay = randomInt(random, profile.delayMs[0], profile.delayMs[1]);
    const go = !chance(random, profile.noGoShare);
    let target: Glyph = GO_GLYPH;
    let stop: Glyph = profile.similarNoGo ? nearGlyph(random, GO_GLYPH) : STOP_GLYPH;
    if (profile.kind === 'cued') {
      target = pick(random, ALL_GLYPHS);
      stop = profile.similarNoGo
        ? nearGlyph(random, target)
        : (distinctGlyphs(random, 2).find(
            (g) => g.shape !== target.shape && g.color !== target.color,
          ) ?? nearGlyph(random, target));
    }
    const stimulus = go ? target : stop;
    return {
      ...identity,
      prompt:
        profile.kind === 'simple'
          ? 'Tap as soon as the shape appears.'
          : `Tap only for the ${glyphLabel(target)}.`,
      content: { kind: profile.kind, target, stimulus },
      response: tapResponse(go, delay, profile.windowMs),
      explanation: go
        ? `It was the ${glyphLabel(target)}: a go trial.`
        : `It was the ${glyphLabel(stimulus)}, not the ${glyphLabel(target)}: holding back was right.`,
      skills:
        profile.kind === 'simple' ? ['reaction-time'] : ['reaction-time', 'selective-attention'],
      timing: profile.timing,
    };
  },
};
