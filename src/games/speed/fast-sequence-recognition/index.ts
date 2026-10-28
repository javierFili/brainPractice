import { defineGameModule } from '../../types';
import { fastSequenceRecognitionGame } from './content/definition';
import type { FastSequenceChallenge } from './content/types';
import { FastSequenceView } from './ui/FastSequenceView';
import { renderSequenceOption } from './ui/sequenceOptions';

export const fastSequenceRecognitionModule = defineGameModule<FastSequenceChallenge>({
  definition: fastSequenceRecognitionGame,
  ContentView: FastSequenceView,
  kindLabels: { digits: 'Digits', letters: 'Letters', shapes: 'Shapes' },
  renderOption: renderSequenceOption,
});
