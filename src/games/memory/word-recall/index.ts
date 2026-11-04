import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { wordRecallGame } from './content/definition';
import type { WordRecallChallenge } from './content/types';
import { WordRecallView } from './ui/WordRecallView';

export const wordRecallModule = defineGameModule<WordRecallChallenge>({
  definition: wordRecallGame,
  ContentView: WordRecallView,
  kindLabels: {
    recognise: msg('memory:wordRecall.kinds.recognise'),
    similar: msg('memory:wordRecall.kinds.similar'),
    order: msg('memory:wordRecall.kinds.order'),
  },
});
