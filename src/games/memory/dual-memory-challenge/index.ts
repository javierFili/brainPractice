import { defineGameModule } from '../../types';
import { renderNamedOption } from '../shared/ui/faces';
import { dualMemoryGame } from './content/definition';
import type { DualMemoryChallenge } from './content/types';
import { DualMemoryView } from './ui/DualMemoryView';

export const dualMemoryChallengeModule = defineGameModule<DualMemoryChallenge>({
  definition: dualMemoryGame,
  ContentView: DualMemoryView,
  kindLabels: {
    where: 'Where was it?',
    'which-nth': 'Which came in a given turn?',
    'which-here': 'Which was in this square?',
    'where-nth': 'Where was the n-th object?',
  },
  renderOption: renderNamedOption,
});
