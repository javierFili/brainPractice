import { defineGameModule } from '../../types';
import { abstractPatternGame } from './content/definition';
import type { AbstractChallenge } from './content/types';
import { AbstractView } from './ui/AbstractView';

export const abstractPatternModule = defineGameModule<AbstractChallenge>({
  definition: abstractPatternGame,
  ContentView: AbstractView,
  kindLabels: {
    colour: 'Colour rules',
    shape: 'Shape rules',
    count: 'Counting rules',
    direction: 'Direction rules',
    order: 'Order rules',
  },
});
