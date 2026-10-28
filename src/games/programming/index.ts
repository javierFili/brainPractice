import type { GameModule } from '../types';
import { logicModule } from './algorithmic-logic';
import { bugHunterModule } from './bug-hunter';
import { codeMemoryModule } from './code-memory';
import { codeScanModule } from './code-scan';
import { patternArchitectModule } from './pattern-architect';
import { variableTrackingModule } from './variable-tracking';
import { conditionalLogicModule } from './conditional-logic';
import { loopPredictionModule } from './loop-prediction';
import { dependencyOrderingModule } from './dependency-ordering';
import { algorithmConstructionModule } from './algorithm-construction';

/** Programming specialisation, in catalog order. */
export const PROGRAMMING_GAMES: readonly GameModule[] = [
  codeMemoryModule,
  logicModule,
  bugHunterModule,
  codeScanModule,
  patternArchitectModule,
  variableTrackingModule,
  conditionalLogicModule,
  loopPredictionModule,
  dependencyOrderingModule,
  algorithmConstructionModule,
];
