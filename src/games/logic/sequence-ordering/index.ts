import { defineGameModule } from '../../types';
import { sequenceOrderingGame } from './content/definition';
import type { OrderingChallenge } from './content/types';
import { SequenceOrderingView } from './ui/SequenceOrderingView';

export const sequenceOrderingModule = defineGameModule<OrderingChallenge>({
  definition: sequenceOrderingGame,
  ContentView: SequenceOrderingView,
  kindLabels: { race: 'Race results', queue: 'People in a line' },
});
