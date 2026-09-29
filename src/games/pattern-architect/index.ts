import { defineGameModule } from '../types';
import { patternArchitectGame } from './content/definition';
import type { PatternChallenge } from './content/types';
import { PatternContentView } from './ui/PatternContentView';

export const patternArchitectModule = defineGameModule<PatternChallenge>({
  definition: patternArchitectGame,
  ContentView: PatternContentView,
  kindLabels: {
    'number-sequence': 'Number sequences',
    'symbol-grid': 'Symbol grids',
    'transform-inference': 'Hidden programs',
    'structure-match': 'Matching structures',
    'tree-analogy': 'Tree analogies',
  },
});
