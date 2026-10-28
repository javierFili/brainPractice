import { defineGameModule } from '../../types';
import { algorithmicReasoningGame } from './content/definition';
import type { RobotChallenge } from './content/types';
import { RobotView } from './ui/RobotView';

export const algorithmicReasoningModule = defineGameModule<RobotChallenge>({
  definition: algorithmicReasoningGame,
  ContentView: RobotView,
  kindLabels: {
    straight: 'Moves and turns',
    loops: 'Repeated steps',
    conditions: 'Wall checks',
  },
});
