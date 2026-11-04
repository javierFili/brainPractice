import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { logicGame } from './content/definition';
import type { LogicChallenge } from './content/types';
import { LogicContentView } from './ui/LogicContentView';

export const logicModule = defineGameModule<LogicChallenge>({
  definition: logicGame,
  ContentView: LogicContentView,
  kindLabels: {
    'dependency-order': msg('programming:algorithmicLogic.kinds.dependencyOrder'),
    'dependency-count': msg('programming:algorithmicLogic.kinds.dependencyCount'),
    'critical-path': msg('programming:algorithmicLogic.kinds.criticalPath'),
    'program-trace': msg('programming:algorithmicLogic.kinds.programTrace'),
    'constraint-arrangement': msg('programming:algorithmicLogic.kinds.constraintArrangement'),
  },
});
