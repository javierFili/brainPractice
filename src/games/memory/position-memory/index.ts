import { defineGameModule } from '../../types';
import { positionMemoryGame } from './content/definition';
import type { PositionMemoryChallenge } from './content/types';
import { PositionMemoryView } from './ui/PositionMemoryView';

export const positionMemoryModule = defineGameModule<PositionMemoryChallenge>({
  definition: positionMemoryGame,
  ContentView: PositionMemoryView,
  kindLabels: { plain: 'Lit cells', filtered: 'Blue cells among decoys' },
});
