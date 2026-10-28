import { defineGameModule } from '../../types';
import { conditionalLogicGame } from './content/definition';
import type { ConditionalChallenge } from './content/types';
import { ConditionalLogicView } from './ui/ConditionalLogicView';

export const conditionalLogicModule = defineGameModule<ConditionalChallenge>({
  definition: conditionalLogicGame,
  ContentView: ConditionalLogicView,
  kindLabels: {
    branch: 'If / elif / else chains',
    nested: 'Nested conditions',
    'find-input': 'Input for an output',
    'short-circuit': 'Short-circuit evaluation',
  },
});
