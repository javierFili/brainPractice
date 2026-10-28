import { defineGameModule } from '../../types';
import { renderPatternOption } from '../shared/ui';
import { matrixReasoningGame } from './content/definition';
import type { MatrixChallenge } from './content/types';
import { MatrixView } from './ui/MatrixView';

export const matrixReasoningModule = defineGameModule<MatrixChallenge>({
  definition: matrixReasoningGame,
  ContentView: MatrixView,
  kindLabels: {
    'shapes-colours': 'Shapes and colours',
    counts: 'Shapes, colours and counts',
    arrows: 'Turning arrows',
  },
  renderOption: renderPatternOption,
});
