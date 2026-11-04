import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { visualChangesGame } from './content/definition';
import type { VisualChangesChallenge } from './content/types';
import { VisualChangesView } from './ui/VisualChangesView';

export const visualChangesModule = defineGameModule<VisualChangesChallenge>({
  definition: visualChangesGame,
  ContentView: VisualChangesView,
  kindLabels: {
    color: msg('memory:visualChanges.kinds.color'),
    shape: msg('memory:visualChanges.kinds.shape'),
    swap: msg('memory:visualChanges.kinds.swap'),
  },
});
