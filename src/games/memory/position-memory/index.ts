import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { positionMemoryGame } from './content/definition';
import type { PositionMemoryChallenge } from './content/types';
import { PositionMemoryView } from './ui/PositionMemoryView';

export const positionMemoryModule = defineGameModule<PositionMemoryChallenge>({
  definition: positionMemoryGame,
  ContentView: PositionMemoryView,
  kindLabels: {
    plain: msg('memory:positionMemory.kinds.plain'),
    filtered: msg('memory:positionMemory.kinds.filtered'),
  },
});
