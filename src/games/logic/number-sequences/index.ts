import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { numberSequencesGame } from './content/definition';
import type { SequenceChallenge } from './content/types';
import { NumberSequencesView } from './ui/NumberSequencesView';

export const numberSequencesModule = defineGameModule<SequenceChallenge>({
  definition: numberSequencesGame,
  ContentView: NumberSequencesView,
  kindLabels: {
    add: msg('logic:numberSequences.kinds.add'),
    multiply: msg('logic:numberSequences.kinds.multiply'),
    'alternating-add': msg('logic:numberSequences.kinds.alternating-add'),
    'growing-add': msg('logic:numberSequences.kinds.growing-add'),
    interleaved: msg('logic:numberSequences.kinds.interleaved'),
    'two-step': msg('logic:numberSequences.kinds.two-step'),
    'sum-of-two': msg('logic:numberSequences.kinds.sum-of-two'),
  },
});
