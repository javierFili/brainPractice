import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { workingMemoryGridGame } from './content/definition';
import type { WorkingGridChallenge } from './content/types';
import { WorkingGridView } from './ui/WorkingGridView';

export const workingMemoryGridModule = defineGameModule<WorkingGridChallenge>({
  definition: workingMemoryGridGame,
  ContentView: WorkingGridView,
  kindLabels: {
    'last-k': msg('memory:workingMemoryGrid.kinds.lastK'),
    'n-back': msg('memory:workingMemoryGrid.kinds.nBack'),
  },
});
