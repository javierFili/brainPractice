import { defineGameModule } from '../../types';
import { visualSearchSprintGame } from './content/definition';
import type { VisualSearchChallenge } from './content/types';
import { VisualSearchView } from './ui/VisualSearchView';

export const visualSearchSprintModule = defineGameModule<VisualSearchChallenge>({
  definition: visualSearchSprintGame,
  ContentView: VisualSearchView,
  kindLabels: {
    feature: 'Shape pop-out',
    similar: 'Look-alike shapes',
    conjunction: 'Colour and shape combined',
  },
});
