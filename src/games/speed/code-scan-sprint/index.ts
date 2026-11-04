import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { codeScanSprintGame } from './content/definition';
import type { CodeScanSprintChallenge } from './content/types';
import { CodeScanSprintView } from './ui/CodeScanSprintView';

export const codeScanSprintModule = defineGameModule<CodeScanSprintChallenge>({
  definition: codeScanSprintGame,
  ContentView: CodeScanSprintView,
  kindLabels: {
    call: msg('speed:codeScanSprint.kinds.call'),
    number: msg('speed:codeScanSprint.kinds.number'),
    'first-assign': msg('speed:codeScanSprint.kinds.firstAssign'),
    'last-assign': msg('speed:codeScanSprint.kinds.lastAssign'),
    condition: msg('speed:codeScanSprint.kinds.condition'),
  },
});
