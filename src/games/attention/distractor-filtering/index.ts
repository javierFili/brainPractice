import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { distractorFilteringGame } from './content/definition';
import type { DistractorFilteringChallenge } from './content/types';
import { DistractorFilteringView } from './ui/DistractorFilteringView';

export const distractorFilteringModule = defineGameModule<DistractorFilteringChallenge>({
  definition: distractorFilteringGame,
  ContentView: DistractorFilteringView,
  kindLabels: {
    shape: msg('attention:distractorFiltering.kinds.shape'),
    color: msg('attention:distractorFiltering.kinds.color'),
    conjunction: msg('attention:distractorFiltering.kinds.conjunction'),
  },
});
