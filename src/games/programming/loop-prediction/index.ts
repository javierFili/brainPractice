import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { loopPredictionGame } from './content/definition';
import type { LoopChallenge } from './content/types';
import { LoopPredictionView } from './ui/LoopPredictionView';

export const loopPredictionModule = defineGameModule<LoopChallenge>({
  definition: loopPredictionGame,
  ContentView: LoopPredictionView,
  kindLabels: {
    iterations: msg('programming:loopPrediction.kinds.iterations'),
    'final-value': msg('programming:loopPrediction.kinds.finalValue'),
    'last-output': msg('programming:loopPrediction.kinds.lastOutput'),
  },
});
