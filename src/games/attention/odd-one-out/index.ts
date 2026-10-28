import { defineGameModule } from '../../types';
import { oddOneOutGame } from './content/definition';
import type { OddOneOutChallenge } from './content/types';
import { OddOneOutView } from './ui/OddOneOutView';

export const oddOneOutModule = defineGameModule<OddOneOutChallenge>({
  definition: oddOneOutGame,
  ContentView: OddOneOutView,
  kindLabels: {
    color: 'Different colour',
    shape: 'Different shape',
    turn: 'Turned shape',
    mirror: 'Mirrored shape',
  },
});
