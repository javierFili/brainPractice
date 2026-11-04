import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { oddOneOutGame } from './content/definition';
import type { OddOneOutChallenge } from './content/types';
import { OddOneOutView } from './ui/OddOneOutView';

export const oddOneOutModule = defineGameModule<OddOneOutChallenge>({
  definition: oddOneOutGame,
  ContentView: OddOneOutView,
  kindLabels: {
    color: msg('attention:oddOneOut.kinds.color'),
    shape: msg('attention:oddOneOut.kinds.shape'),
    turn: msg('attention:oddOneOut.kinds.turn'),
    mirror: msg('attention:oddOneOut.kinds.mirror'),
  },
});
