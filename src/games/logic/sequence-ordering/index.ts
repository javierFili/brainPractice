import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { sequenceOrderingGame } from './content/definition';
import type { OrderingChallenge } from './content/types';
import { SequenceOrderingView } from './ui/SequenceOrderingView';

export const sequenceOrderingModule = defineGameModule<OrderingChallenge>({
  definition: sequenceOrderingGame,
  ContentView: SequenceOrderingView,
  kindLabels: {
    race: msg('logic:sequenceOrdering.kinds.race'),
    queue: msg('logic:sequenceOrdering.kinds.queue'),
  },
});
