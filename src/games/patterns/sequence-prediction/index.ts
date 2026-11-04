import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { sequencePredictionGame } from './content/definition';
import type { SequencePredictionChallenge } from './content/types';
import { renderFrameOption } from './ui/frameOptions';
import { SequencePredictionView } from './ui/SequencePredictionView';

export const sequencePredictionModule = defineGameModule<SequencePredictionChallenge>({
  definition: sequencePredictionGame,
  ContentView: SequencePredictionView,
  kindLabels: {
    move: msg('patterns:sequencePrediction.kinds.move'),
    rotate: msg('patterns:sequencePrediction.kinds.rotate'),
    'move-rotate': msg('patterns:sequencePrediction.kinds.move-rotate'),
    'two-marks': msg('patterns:sequencePrediction.kinds.two-marks'),
  },
  renderOption: renderFrameOption,
});
