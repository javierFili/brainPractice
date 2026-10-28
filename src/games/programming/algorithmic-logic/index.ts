import { defineGameModule } from '../../types';
import { logicGame } from './content/definition';
import type { LogicChallenge } from './content/types';
import { LogicContentView } from './ui/LogicContentView';

export const logicModule = defineGameModule<LogicChallenge>({
  definition: logicGame,
  ContentView: LogicContentView,
  kindLabels: {
    'dependency-order': 'Execution order',
    'dependency-count': 'Transitive dependencies',
    'critical-path': 'Parallel scheduling',
    'program-trace': 'Program tracing',
    'constraint-arrangement': 'Constraint puzzles',
  },
});
