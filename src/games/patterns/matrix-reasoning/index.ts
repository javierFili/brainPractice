import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { renderPatternOption } from '../shared/ui';
import { matrixReasoningGame } from './content/definition';
import type { MatrixChallenge } from './content/types';
import { MatrixView } from './ui/MatrixView';

export const matrixReasoningModule = defineGameModule<MatrixChallenge>({
  definition: matrixReasoningGame,
  ContentView: MatrixView,
  kindLabels: {
    'shapes-colours': msg('patterns:matrixReasoning.kinds.shapes-colours'),
    counts: msg('patterns:matrixReasoning.kinds.counts'),
    arrows: msg('patterns:matrixReasoning.kinds.arrows'),
  },
  renderOption: renderPatternOption,
});
