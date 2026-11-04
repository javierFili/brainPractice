import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { renderNamedOption } from '../shared/ui/faces';
import { dualMemoryGame } from './content/definition';
import type { DualMemoryChallenge } from './content/types';
import { DualMemoryView } from './ui/DualMemoryView';

export const dualMemoryChallengeModule = defineGameModule<DualMemoryChallenge>({
  definition: dualMemoryGame,
  ContentView: DualMemoryView,
  kindLabels: {
    where: msg('memory:dualMemoryChallenge.kinds.where'),
    'which-nth': msg('memory:dualMemoryChallenge.kinds.whichNth'),
    'which-here': msg('memory:dualMemoryChallenge.kinds.whichHere'),
    'where-nth': msg('memory:dualMemoryChallenge.kinds.whereNth'),
  },
  renderOption: renderNamedOption,
});
