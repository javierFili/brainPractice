import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { codeScanGame } from './content/definition';
import type { SpeedChallenge } from './content/types';
import { CodeScanContentView } from './ui/CodeScanContentView';

export const codeScanModule = defineGameModule<SpeedChallenge>({
  definition: codeScanGame,
  ContentView: CodeScanContentView,
  kindLabels: {
    'same-or-different': msg('programming:codeScan.kinds.sameOrDifferent'),
    'find-the-change': msg('programming:codeScan.kinds.findTheChange'),
    'classify-the-change': msg('programming:codeScan.kinds.classifyTheChange'),
  },
});
