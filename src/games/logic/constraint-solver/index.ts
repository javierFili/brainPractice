import { defineGameModule } from '../../types';
import { constraintSolverGame } from './content/definition';
import type { ConstraintChallenge } from './content/types';
import { ConstraintView } from './ui/ConstraintView';

export const constraintSolverModule = defineGameModule<ConstraintChallenge>({
  definition: constraintSolverGame,
  ContentView: ConstraintView,
  kindLabels: {
    latin: 'Rows and columns',
    boxes: 'Grids with boxes',
    inequalities: '“Smaller than” grids',
  },
});
