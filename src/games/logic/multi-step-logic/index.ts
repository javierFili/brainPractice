import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { multiStepLogicGame } from './content/definition';
import type { MultiStepChallenge } from './content/types';
import { MultiStepView } from './ui/MultiStepView';

export const multiStepLogicModule = defineGameModule<MultiStepChallenge>({
  definition: multiStepLogicGame,
  ContentView: MultiStepView,
  kindLabels: {
    numbers: msg('logic:multiStepLogic.kinds.numbers'),
    compare: msg('logic:multiStepLogic.kinds.compare'),
  },
});
