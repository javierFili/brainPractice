import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { algorithmConstructionGame } from './content/definition';
import type { ConstructionChallenge } from './content/types';
import { AlgorithmConstructionView } from './ui/AlgorithmConstructionView';

export const algorithmConstructionModule = defineGameModule<ConstructionChallenge>({
  definition: algorithmConstructionGame,
  ContentView: AlgorithmConstructionView,
  kindLabels: {
    'order-blocks': msg('programming:algorithmConstruction.kinds.orderBlocks'),
    'spare-block': msg('programming:algorithmConstruction.kinds.spareBlock'),
  },
});
