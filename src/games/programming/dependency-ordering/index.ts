import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { dependencyOrderingGame } from './content/definition';
import type { DependencyChallenge } from './content/types';
import { DependencyOrderingView } from './ui/DependencyOrderingView';

export const dependencyOrderingModule = defineGameModule<DependencyChallenge>({
  definition: dependencyOrderingGame,
  ContentView: DependencyOrderingView,
  kindLabels: {
    'start-first': msg('programming:dependencyOrdering.kinds.startFirst'),
    'ready-next': msg('programming:dependencyOrdering.kinds.readyNext'),
    'full-order': msg('programming:dependencyOrdering.kinds.fullOrder'),
    'valid-order': msg('programming:dependencyOrdering.kinds.validOrder'),
    cycle: msg('programming:dependencyOrdering.kinds.cycle'),
  },
});
