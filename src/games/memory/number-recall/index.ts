import { defineGameModule } from '../../types';
import { numberRecallGame } from './content/definition';
import type { NumberRecallChallenge } from './content/types';
import { NumberRecallView } from './ui/NumberRecallView';

export const numberRecallModule = defineGameModule<NumberRecallChallenge>({
  definition: numberRecallGame,
  ContentView: NumberRecallView,
  kindLabels: {
    'type-back': 'Type the number back',
    'which-group': 'Chunk in a given place',
    'two-numbers': 'Two numbers at once',
  },
  describeOption: (label) => label.split('').join(' '),
});
