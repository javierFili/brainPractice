import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { multiChoiceProcessingGame } from './content/definition';
import type { FlankerChallenge } from './content/types';
import { renderDirectionOption } from './ui/directionOptions';
import { FlankerView } from './ui/FlankerView';

export const multiChoiceProcessingModule = defineGameModule<FlankerChallenge>({
  definition: multiChoiceProcessingGame,
  ContentView: FlankerView,
  kindLabels: {
    single: msg('speed:multiChoiceProcessing.kinds.single'),
    flanker: msg('speed:multiChoiceProcessing.kinds.flanker'),
    cued: msg('speed:multiChoiceProcessing.kinds.cued'),
  },
  renderOption: renderDirectionOption,
});
