import { defineGameModule } from '../../types';
import { truthAndFalsehoodGame } from './content/definition';
import type { TruthChallenge } from './content/types';
import { TruthView } from './ui/TruthView';

export const truthAndFalsehoodModule = defineGameModule<TruthChallenge>({
  definition: truthAndFalsehoodGame,
  ContentView: TruthView,
  kindLabels: {
    one: 'One character',
    who: 'Who tells the truth',
    count: 'How many tell the truth',
  },
});
