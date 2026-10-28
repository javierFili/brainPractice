import type { GameModule } from '../types';
import { changeDetectionModule } from './change-detection';
import { complexVisualInspectionModule } from './complex-visual-inspection';
import { distractorFilteringModule } from './distractor-filtering';
import { dualTaskModule } from './dual-task-attention';
import { errorDetectionModule } from './error-detection';
import { oddOneOutModule } from './odd-one-out';
import { sustainedAttentionModule } from './sustained-attention-challenge';
import { symbolCountingModule } from './symbol-counting';
import { targetTrackingModule } from './target-tracking';
import { visualDifferenceModule } from './visual-difference';

/** Attention category, in catalog order. */
export const ATTENTION_GAMES: readonly GameModule[] = [
  oddOneOutModule,
  visualDifferenceModule,
  targetTrackingModule,
  distractorFilteringModule,
  changeDetectionModule,
  symbolCountingModule,
  errorDetectionModule,
  sustainedAttentionModule,
  dualTaskModule,
  complexVisualInspectionModule,
];
