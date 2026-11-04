import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { constraintSolverGame } from './content/definition';
import type { ConstraintChallenge } from './content/types';
import { ConstraintView } from './ui/ConstraintView';

export const constraintSolverModule = defineGameModule<ConstraintChallenge>({
  definition: constraintSolverGame,
  ContentView: ConstraintView,
  kindLabels: {
    latin: msg('logic:constraintSolver.kinds.latin'),
    boxes: msg('logic:constraintSolver.kinds.boxes'),
    inequalities: msg('logic:constraintSolver.kinds.inequalities'),
  },
});
