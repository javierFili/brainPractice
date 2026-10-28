import type { GameModule } from '../types';
import { codeScanSprintModule } from './code-scan-sprint';
import { colorAndShapeDecisionsModule } from './color-and-shape-decisions';
import { fastSequenceRecognitionModule } from './fast-sequence-recognition';
import { mentalArithmeticSprintModule } from './mental-arithmetic-sprint';
import { multiChoiceProcessingModule } from './multi-choice-processing';
import { numberComparisonModule } from './number-comparison';
import { rapidClassificationModule } from './rapid-classification';
import { rapidSymbolMatchingModule } from './rapid-symbol-matching';
import { reactionTestModule } from './reaction-test';
import { visualSearchSprintModule } from './visual-search-sprint';

/** Speed category, in catalog order. */
export const SPEED_GAMES: readonly GameModule[] = [
  reactionTestModule,
  rapidSymbolMatchingModule,
  numberComparisonModule,
  visualSearchSprintModule,
  rapidClassificationModule,
  colorAndShapeDecisionsModule,
  fastSequenceRecognitionModule,
  mentalArithmeticSprintModule,
  codeScanSprintModule,
  multiChoiceProcessingModule,
];
