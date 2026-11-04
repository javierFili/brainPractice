import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { bugHunterGame } from './content/definition';
import type { AttentionChallenge } from './content/types';
import { BugHunterContentView } from './ui/BugHunterContentView';

export const bugHunterModule = defineGameModule<AttentionChallenge>({
  definition: bugHunterGame,
  ContentView: BugHunterContentView,
  kindLabels: {
    'sequence-anomaly': msg('programming:bugHunter.kinds.sequenceAnomaly'),
    'schema-violation': msg('programming:bugHunter.kinds.schemaViolation'),
    'code-rule': msg('programming:bugHunter.kinds.codeRule'),
    'multi-rule': msg('programming:bugHunter.kinds.multiRule'),
  },
});
