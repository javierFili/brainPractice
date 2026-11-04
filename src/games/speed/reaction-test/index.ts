import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { reactionTestGame } from './content/definition';
import type { ReactionChallenge } from './content/types';
import { ReactionView } from './ui/ReactionView';

export const reactionTestModule = defineGameModule<ReactionChallenge>({
  definition: reactionTestGame,
  ContentView: ReactionView,
  kindLabels: {
    simple: msg('speed:reactionTest.kinds.simple'),
    'go-no-go': msg('speed:reactionTest.kinds.goNoGo'),
    cued: msg('speed:reactionTest.kinds.cued'),
  },
});
