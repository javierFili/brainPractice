import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { conditionalReasoningGame } from './content/definition';
import type { ConditionalChallenge } from './content/types';
import { ConditionalView } from './ui/ConditionalView';

export const conditionalReasoningModule = defineGameModule<ConditionalChallenge>({
  definition: conditionalReasoningGame,
  ContentView: ConditionalView,
  kindLabels: {
    basic: msg('logic:conditionalReasoning.kinds.basic'),
    chain: msg('logic:conditionalReasoning.kinds.chain'),
    unless: msg('logic:conditionalReasoning.kinds.unless'),
    'only-if': msg('logic:conditionalReasoning.kinds.only-if'),
    mixed: msg('logic:conditionalReasoning.kinds.mixed'),
  },
});
