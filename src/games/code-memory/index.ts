import { defineGameModule } from '../types';
import { codeMemoryGame } from './content/definition';
import type { MemoryChallenge } from './content/types';
import { CodeMemoryContentView } from './ui/CodeMemoryContentView';

export const codeMemoryModule = defineGameModule<MemoryChallenge>({
  definition: codeMemoryGame,
  ContentView: CodeMemoryContentView,
  kindLabels: {
    'record-recall': 'Record recall',
    'cross-reference': 'Cross-reference lookup',
    'foreign-key-join': 'Foreign-key joins',
    'sequence-recall': 'Call sequences',
    'variable-state': 'Variable state',
    'position-recall': 'Grid positions',
  },
});
