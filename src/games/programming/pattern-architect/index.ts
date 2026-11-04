import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { patternArchitectGame } from './content/definition';
import { describeLabel } from './content/format';
import type { PatternChallenge } from './content/types';
import { PatternContentView } from './ui/PatternContentView';

export const patternArchitectModule = defineGameModule<PatternChallenge>({
  definition: patternArchitectGame,
  ContentView: PatternContentView,
  describeOption: describeLabel,
  kindLabels: {
    'number-sequence': msg('programming:patternArchitect.kinds.numberSequence'),
    'symbol-grid': msg('programming:patternArchitect.kinds.symbolGrid'),
    'transform-inference': msg('programming:patternArchitect.kinds.transformInference'),
    'structure-match': msg('programming:patternArchitect.kinds.structureMatch'),
    'tree-analogy': msg('programming:patternArchitect.kinds.treeAnalogy'),
  },
});
