import { defineGameModule } from '../../types';
import { gridPathGame } from './content/definition';
import type { GridPathChallenge } from './content/types';
import { GridPathView } from './ui/GridPathView';

export const gridPathModule = defineGameModule<GridPathChallenge>({
  definition: gridPathGame,
  ContentView: GridPathView,
  kindLabels: {
    'shortest-length': 'Shortest route length',
    'reachable-exit': 'Reachable exit',
    'must-pass': 'Cell every route crosses',
  },
});
