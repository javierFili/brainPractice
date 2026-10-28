import { defineGameModule } from '../../types';
import { sequenceRecallGame } from './content/definition';
import type { SequenceRecallChallenge } from './content/types';
import { SequenceRecallView } from './ui/SequenceRecallView';
import { renderSymbol } from './ui/renderSymbol';

export const sequenceRecallModule = defineGameModule<SequenceRecallChallenge>({
  definition: sequenceRecallGame,
  ContentView: SequenceRecallView,
  kindLabels: { forward: 'Forward order', backward: 'Reverse order' },
  renderOption: renderSymbol,
});
