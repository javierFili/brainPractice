import { defineGameModule } from '../../types';
import { visualChangesGame } from './content/definition';
import type { VisualChangesChallenge } from './content/types';
import { VisualChangesView } from './ui/VisualChangesView';

export const visualChangesModule = defineGameModule<VisualChangesChallenge>({
  definition: visualChangesGame,
  ContentView: VisualChangesView,
  kindLabels: { color: 'Colour change', shape: 'Shape change', swap: 'Two shapes swapped' },
});
