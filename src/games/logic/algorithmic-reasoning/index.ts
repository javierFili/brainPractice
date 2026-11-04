import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { algorithmicReasoningGame } from './content/definition';
import type { RobotChallenge } from './content/types';
import { RobotView } from './ui/RobotView';

export const algorithmicReasoningModule = defineGameModule<RobotChallenge>({
  definition: algorithmicReasoningGame,
  ContentView: RobotView,
  kindLabels: {
    straight: msg('logic:algorithmicReasoning.kinds.straight'),
    loops: msg('logic:algorithmicReasoning.kinds.loops'),
    conditions: msg('logic:algorithmicReasoning.kinds.conditions'),
  },
});
