import { defineGameModule } from '../../types';
import { codeScanGame } from './content/definition';
import type { SpeedChallenge } from './content/types';
import { CodeScanContentView } from './ui/CodeScanContentView';

export const codeScanModule = defineGameModule<SpeedChallenge>({
  definition: codeScanGame,
  ContentView: CodeScanContentView,
  kindLabels: {
    'same-or-different': 'Same or different',
    'find-the-change': 'Find the change',
    'classify-the-change': 'Classify the change',
  },
});
