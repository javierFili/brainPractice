import type { GameModule } from '../types';
import { abstractPatternModule } from './abstract-pattern-challenge';
import { gridPathModule } from './grid-and-path-reasoning';
import { matrixReasoningModule } from './matrix-reasoning';
import { numberPatternModule } from './number-pattern-completion';
import { ruleDiscoveryModule } from './rule-based-pattern-discovery';
import { sequencePredictionModule } from './sequence-prediction';
import { shapeRotationModule } from './shape-rotation';
import { spatialTransformModule } from './spatial-transformation';
import { symmetryModule } from './symmetry-recognition';
import { visualPatternModule } from './visual-pattern-completion';

/** Patterns category, in catalog order. */
export const PATTERNS_GAMES: readonly GameModule[] = [
  visualPatternModule,
  numberPatternModule,
  shapeRotationModule,
  matrixReasoningModule,
  sequencePredictionModule,
  symmetryModule,
  spatialTransformModule,
  ruleDiscoveryModule,
  gridPathModule,
  abstractPatternModule,
];
