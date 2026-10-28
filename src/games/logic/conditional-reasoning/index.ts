import { defineGameModule } from '../../types';
import { conditionalReasoningGame } from './content/definition';
import type { ConditionalChallenge } from './content/types';
import { ConditionalView } from './ui/ConditionalView';

export const conditionalReasoningModule = defineGameModule<ConditionalChallenge>({
  definition: conditionalReasoningGame,
  ContentView: ConditionalView,
  kindLabels: {
    basic: 'One if-then rule',
    chain: 'Chains of rules',
    unless: '“Unless” rules',
    'only-if': '“Only if” rules',
    mixed: 'Mixed rule sets',
  },
});
