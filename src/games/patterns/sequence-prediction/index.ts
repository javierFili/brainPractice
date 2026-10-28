import { defineGameModule } from '../../types';
import { sequencePredictionGame } from './content/definition';
import type { SequencePredictionChallenge } from './content/types';
import { describeFrameOption, renderFrameOption } from './ui/frameOptions';
import { SequencePredictionView } from './ui/SequencePredictionView';

export const sequencePredictionModule = defineGameModule<SequencePredictionChallenge>({
  definition: sequencePredictionGame,
  ContentView: SequencePredictionView,
  kindLabels: {
    move: 'Moving marks',
    rotate: 'Turning arrows',
    'move-rotate': 'Moving and turning',
    'two-marks': 'Two marks at once',
  },
  renderOption: renderFrameOption,
  describeOption: describeFrameOption,
});
