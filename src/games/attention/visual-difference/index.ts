import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { visualDifferenceGame } from './content/definition';
import type { VisualDifferenceChallenge } from './content/types';
import { VisualDifferenceView } from './ui/VisualDifferenceView';

export const visualDifferenceModule = defineGameModule<VisualDifferenceChallenge>({
  definition: visualDifferenceGame,
  ContentView: VisualDifferenceView,
  kindLabels: {
    plain: msg('attention:visualDifference.kinds.plain'),
    oriented: msg('attention:visualDifference.kinds.oriented'),
  },
});
