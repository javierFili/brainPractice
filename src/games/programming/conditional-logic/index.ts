import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { conditionalLogicGame } from './content/definition';
import type { ConditionalChallenge } from './content/types';
import { ConditionalLogicView } from './ui/ConditionalLogicView';

export const conditionalLogicModule = defineGameModule<ConditionalChallenge>({
  definition: conditionalLogicGame,
  ContentView: ConditionalLogicView,
  kindLabels: {
    branch: msg('programming:conditionalLogic.kinds.branch'),
    nested: msg('programming:conditionalLogic.kinds.nested'),
    'find-input': msg('programming:conditionalLogic.kinds.findInput'),
    'short-circuit': msg('programming:conditionalLogic.kinds.shortCircuit'),
  },
});
