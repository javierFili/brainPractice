import { defineGameModule } from '../../types';
import { algorithmConstructionGame } from './content/definition';
import type { ConstructionChallenge } from './content/types';
import { AlgorithmConstructionView } from './ui/AlgorithmConstructionView';

export const algorithmConstructionModule = defineGameModule<ConstructionChallenge>({
  definition: algorithmConstructionGame,
  ContentView: AlgorithmConstructionView,
  kindLabels: {
    'order-blocks': 'Order every block',
    'spare-block': 'Order with a spare block',
  },
});
