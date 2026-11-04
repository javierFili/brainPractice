import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { codeMemoryGame } from './content/definition';
import type { MemoryChallenge } from './content/types';
import { CodeMemoryContentView } from './ui/CodeMemoryContentView';

export const codeMemoryModule = defineGameModule<MemoryChallenge>({
  definition: codeMemoryGame,
  ContentView: CodeMemoryContentView,
  kindLabels: {
    'record-recall': msg('programming:codeMemory.kinds.recordRecall'),
    'cross-reference': msg('programming:codeMemory.kinds.crossReference'),
    'foreign-key-join': msg('programming:codeMemory.kinds.foreignKeyJoin'),
    'sequence-recall': msg('programming:codeMemory.kinds.sequenceRecall'),
    'variable-state': msg('programming:codeMemory.kinds.variableState'),
    'position-recall': msg('programming:codeMemory.kinds.positionRecall'),
  },
});
