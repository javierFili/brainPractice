import { defineGameModule } from '../../types';
import { dependencyOrderingGame } from './content/definition';
import type { DependencyChallenge } from './content/types';
import { DependencyOrderingView } from './ui/DependencyOrderingView';

export const dependencyOrderingModule = defineGameModule<DependencyChallenge>({
  definition: dependencyOrderingGame,
  ContentView: DependencyOrderingView,
  kindLabels: {
    'start-first': 'What can start first',
    'ready-next': 'What is unblocked',
    'full-order': 'Complete order',
    'valid-order': 'Valid order among options',
    cycle: 'Cycle detection',
  },
});
