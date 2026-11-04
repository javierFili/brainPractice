import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { fastSequenceRecognitionGame } from './content/definition';
import type { FastSequenceChallenge } from './content/types';
import { FastSequenceView } from './ui/FastSequenceView';
import { renderSequenceOption } from './ui/sequenceOptions';

export const fastSequenceRecognitionModule = defineGameModule<FastSequenceChallenge>({
  definition: fastSequenceRecognitionGame,
  ContentView: FastSequenceView,
  kindLabels: {
    digits: msg('speed:fastSequenceRecognition.kinds.digits'),
    letters: msg('speed:fastSequenceRecognition.kinds.letters'),
    shapes: msg('speed:fastSequenceRecognition.kinds.shapes'),
  },
  renderOption: renderSequenceOption,
});
