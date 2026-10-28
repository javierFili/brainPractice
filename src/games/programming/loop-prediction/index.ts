import { defineGameModule } from '../../types';
import { loopPredictionGame } from './content/definition';
import type { LoopChallenge } from './content/types';
import { LoopPredictionView } from './ui/LoopPredictionView';

export const loopPredictionModule = defineGameModule<LoopChallenge>({
  definition: loopPredictionGame,
  ContentView: LoopPredictionView,
  kindLabels: {
    iterations: 'Iteration count',
    'final-value': 'Value after the loop',
    'last-output': 'Last printed value',
  },
});
