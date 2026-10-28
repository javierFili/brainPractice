import { defineGameModule } from '../../types';
import { reactionTestGame } from './content/definition';
import type { ReactionChallenge } from './content/types';
import { ReactionView } from './ui/ReactionView';

export const reactionTestModule = defineGameModule<ReactionChallenge>({
  definition: reactionTestGame,
  ContentView: ReactionView,
  kindLabels: { simple: 'Simple reaction', 'go-no-go': 'Go / stop', cued: 'Cued go / stop' },
});
