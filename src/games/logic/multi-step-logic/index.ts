import { defineGameModule } from '../../types';
import { multiStepLogicGame } from './content/definition';
import type { MultiStepChallenge } from './content/types';
import { MultiStepView } from './ui/MultiStepView';

export const multiStepLogicModule = defineGameModule<MultiStepChallenge>({
  definition: multiStepLogicGame,
  ContentView: MultiStepView,
  kindLabels: { numbers: 'Chained numbers', compare: 'Chained comparisons' },
});
