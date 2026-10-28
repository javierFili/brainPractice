import { defineGameModule } from '../../types';
import { numberSequencesGame } from './content/definition';
import type { SequenceChallenge } from './content/types';
import { NumberSequencesView } from './ui/NumberSequencesView';

export const numberSequencesModule = defineGameModule<SequenceChallenge>({
  definition: numberSequencesGame,
  ContentView: NumberSequencesView,
  kindLabels: {
    add: 'Constant steps',
    multiply: 'Multiplying',
    'alternating-add': 'Alternating steps',
    'growing-add': 'Growing steps',
    interleaved: 'Two mixed sequences',
    'two-step': 'Two-step rules',
    'sum-of-two': 'Sum of the two before',
  },
});
