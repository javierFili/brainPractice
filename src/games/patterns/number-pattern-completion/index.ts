import { defineGameModule } from '../../types';
import { numberPatternGame } from './content/definition';
import type { NumberPatternChallenge } from './content/types';
import { NumberPatternView } from './ui/NumberPatternView';

export const numberPatternModule = defineGameModule<NumberPatternChallenge>({
  definition: numberPatternGame,
  ContentView: NumberPatternView,
  kindLabels: {
    grid: 'Number grids',
    pyramid: 'Number pyramids',
    wheel: 'Number wheels',
    cross: 'Number crosses',
  },
});
