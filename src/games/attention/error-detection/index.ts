import { defineGameModule } from '../../types';
import { errorDetectionGame } from './content/definition';
import { KIND_LABELS } from './content/format';
import type { ErrorDetectionChallenge } from './content/types';
import { ErrorDetectionView } from './ui/ErrorDetectionView';

export const errorDetectionModule = defineGameModule<ErrorDetectionChallenge>({
  definition: errorDetectionGame,
  ContentView: ErrorDetectionView,
  kindLabels: KIND_LABELS,
});
