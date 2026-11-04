import { tapResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { chance, pick, randomInt } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
import { ALL_GLYPHS, distinctGlyphs, glyphLabel, nearGlyph, type Glyph } from '@/games/kit/content';
import { REACTION_LEVELS } from './levels';
import type { ReactionChallenge, ReactionProfile } from './types';

/** Fixed go/stop shapes for non-cued levels, so the rule is learnt once per session. */
export const GO_GLYPH: Glyph = { shape: 'circle', color: 'green' };
const STOP_GLYPH: Glyph = { shape: 'square', color: 'red' };

export const REACTION_TEST_ID = gameIdOf('reaction-test');

export const reactionTestGame: GameDefinition<ReactionChallenge, ReactionProfile> = {
  id: REACTION_TEST_ID,
  name: msg('speed:reactionTest.name'),
  tagline: msg('speed:reactionTest.tagline'),
  description: msg('speed:reactionTest.description'),
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
    scoringSummary: msg('speed:reactionTest.scoringSummary'),
    feedback: 'brief',
    accessibilityNotes: msg('speed:reactionTest.accessibilityNotes'),
  },
  instructions: [
    msg('speed:reactionTest.instructions.watch'),
    msg('speed:reactionTest.instructions.tap'),
    msg('speed:reactionTest.instructions.goNoGo'),
    msg('speed:reactionTest.instructions.cued'),
  ],
  simpleInstructions: msg('speed:reactionTest.simpleInstructions'),
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
          ? msg('speed:reactionTest.prompt.simple')
          : msg('speed:reactionTest.prompt.target', { target: glyphLabel(target) }),
      content: { kind: profile.kind, target, stimulus },
      response: tapResponse(go, delay, profile.windowMs),
      explanation: go
        ? msg('speed:reactionTest.explanation.go', { target: glyphLabel(target) })
        : msg('speed:reactionTest.explanation.stop', {
            stimulus: glyphLabel(stimulus),
            target: glyphLabel(target),
          }),
      skills:
        profile.kind === 'simple' ? ['reaction-time'] : ['reaction-time', 'selective-attention'],
      timing: profile.timing,
    };
  },
};
