import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { memoryCardsGame } from './content/definition';
import type { MemoryCardsChallenge } from './content/types';
import { MemoryCardsView } from './ui/MemoryCardsView';

export const memoryCardsModule = defineGameModule<MemoryCardsChallenge>({
  definition: memoryCardsGame,
  ContentView: MemoryCardsView,
  kindLabels: {
    objects: msg('memory:memoryCards.kinds.objects'),
    family: msg('memory:memoryCards.kinds.family'),
    glyphs: msg('memory:memoryCards.kinds.glyphs'),
    'near-glyphs': msg('memory:memoryCards.kinds.nearGlyphs'),
  },
});
