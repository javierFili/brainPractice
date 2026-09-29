import { defineGameModule } from '../types';
import { bugHunterGame } from './content/definition';
import type { AttentionChallenge } from './content/types';
import { BugHunterContentView } from './ui/BugHunterContentView';

export const bugHunterModule = defineGameModule<AttentionChallenge>({
  definition: bugHunterGame,
  ContentView: BugHunterContentView,
  kindLabels: {
    'sequence-anomaly': 'Sequence anomalies',
    'schema-violation': 'Schema violations',
    'code-rule': 'Code rules',
    'multi-rule': 'Multiple rules',
  },
});
