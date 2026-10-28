import type { GameModule } from '../types';
import { algorithmicReasoningModule } from './algorithmic-reasoning';
import { conditionalReasoningModule } from './conditional-reasoning';
import { constraintSolverModule } from './constraint-solver';
import { logicalDeductionModule } from './logical-deduction';
import { multiStepLogicModule } from './multi-step-logic';
import { numberSequencesModule } from './number-sequences';
import { ruleDiscoveryModule } from './rule-discovery';
import { sequenceOrderingModule } from './sequence-ordering';
import { strategyPuzzleModule } from './strategy-puzzle';
import { truthAndFalsehoodModule } from './truth-and-falsehood';

/** Logic category, in catalog order. */
export const LOGIC_GAMES: readonly GameModule[] = [
  logicalDeductionModule,
  numberSequencesModule,
  ruleDiscoveryModule,
  conditionalReasoningModule,
  constraintSolverModule,
  sequenceOrderingModule,
  truthAndFalsehoodModule,
  strategyPuzzleModule,
  algorithmicReasoningModule,
  multiStepLogicModule,
];
