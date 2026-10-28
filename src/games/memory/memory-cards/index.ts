import { defineGameModule } from '../../types';
import { memoryCardsGame } from './content/definition';
import type { MemoryCardsChallenge } from './content/types';
import { MemoryCardsView } from './ui/MemoryCardsView';

export const memoryCardsModule = defineGameModule<MemoryCardsChallenge>({
  definition: memoryCardsGame,
  ContentView: MemoryCardsView,
  kindLabels: {
    objects: 'Everyday objects',
    family: 'Objects of one family',
    glyphs: 'Coloured shapes',
    'near-glyphs': 'Look-alike shapes',
  },
});
