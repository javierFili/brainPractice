import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { visualSearchSprintGame } from './content/definition';
import type { VisualSearchChallenge } from './content/types';
import { VisualSearchView } from './ui/VisualSearchView';

export const visualSearchSprintModule = defineGameModule<VisualSearchChallenge>({
  definition: visualSearchSprintGame,
  ContentView: VisualSearchView,
  kindLabels: {
    feature: msg('speed:visualSearchSprint.kinds.feature'),
    similar: msg('speed:visualSearchSprint.kinds.similar'),
    conjunction: msg('speed:visualSearchSprint.kinds.conjunction'),
  },
});
