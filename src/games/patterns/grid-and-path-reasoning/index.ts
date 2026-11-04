import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { gridPathGame } from './content/definition';
import type { GridPathChallenge } from './content/types';
import { GridPathView } from './ui/GridPathView';

export const gridPathModule = defineGameModule<GridPathChallenge>({
  definition: gridPathGame,
  ContentView: GridPathView,
  kindLabels: {
    'shortest-length': msg('patterns:gridAndPathReasoning.kinds.shortest-length'),
    'reachable-exit': msg('patterns:gridAndPathReasoning.kinds.reachable-exit'),
    'must-pass': msg('patterns:gridAndPathReasoning.kinds.must-pass'),
  },
});
