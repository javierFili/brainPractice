import { defineGameModule } from '../../types';
import { codeScanSprintGame } from './content/definition';
import type { CodeScanSprintChallenge } from './content/types';
import { CodeScanSprintView } from './ui/CodeScanSprintView';

export const codeScanSprintModule = defineGameModule<CodeScanSprintChallenge>({
  definition: codeScanSprintGame,
  ContentView: CodeScanSprintView,
  kindLabels: {
    call: 'Find the call',
    number: 'Find the number',
    'first-assign': 'First assignment',
    'last-assign': 'Last assignment',
    condition: 'Find the condition',
  },
});
