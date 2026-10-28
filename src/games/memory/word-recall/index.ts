import { defineGameModule } from '../../types';
import { wordRecallGame } from './content/definition';
import type { WordRecallChallenge } from './content/types';
import { WordRecallView } from './ui/WordRecallView';

export const wordRecallModule = defineGameModule<WordRecallChallenge>({
  definition: wordRecallGame,
  ContentView: WordRecallView,
  kindLabels: {
    recognise: 'Words among new words',
    similar: 'Words among same-theme words',
    order: 'Words in order',
  },
});
