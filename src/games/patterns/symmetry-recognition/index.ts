import { defineGameModule } from '../../types';
import { symmetryGame } from './content/definition';
import type { SymmetryChallenge } from './content/types';
import { SymmetryView } from './ui/SymmetryView';

export const symmetryModule = defineGameModule<SymmetryChallenge>({
  definition: symmetryGame,
  ContentView: SymmetryView,
  kindLabels: { classify: 'Spotting mirror lines', complete: 'Drawing the mirror half' },
});
