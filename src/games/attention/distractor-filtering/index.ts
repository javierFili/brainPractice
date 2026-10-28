import { defineGameModule } from '../../types';
import { distractorFilteringGame } from './content/definition';
import type { DistractorFilteringChallenge } from './content/types';
import { DistractorFilteringView } from './ui/DistractorFilteringView';

export const distractorFilteringModule = defineGameModule<DistractorFilteringChallenge>({
  definition: distractorFilteringGame,
  ContentView: DistractorFilteringView,
  kindLabels: { shape: 'One shape', color: 'One colour', conjunction: 'Shape and colour' },
});
