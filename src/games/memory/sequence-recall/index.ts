import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { sequenceRecallGame } from './content/definition';
import type { SequenceRecallChallenge } from './content/types';
import { SequenceRecallView } from './ui/SequenceRecallView';
import { renderSymbol } from './ui/renderSymbol';

export const sequenceRecallModule = defineGameModule<SequenceRecallChallenge>({
  definition: sequenceRecallGame,
  ContentView: SequenceRecallView,
  kindLabels: {
    forward: msg('memory:sequenceRecall.kinds.forward'),
    backward: msg('memory:sequenceRecall.kinds.backward'),
  },
  renderOption: renderSymbol,
});
