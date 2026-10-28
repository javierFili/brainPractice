import { defineGameModule } from '../../types';
import { describePatternOption, renderPatternOption } from '../shared/ui';
import { ruleDiscoveryGame } from './content/definition';
import type { RuleDiscoveryChallenge } from './content/types';
import { RuleDiscoveryView } from './ui/RuleDiscoveryView';

export const ruleDiscoveryModule = defineGameModule<RuleDiscoveryChallenge>({
  definition: ruleDiscoveryGame,
  ContentView: RuleDiscoveryView,
  kindLabels: {
    move: 'Mirrors, turns and slides',
    colour: 'Tiles changing kind',
    gather: 'Falling and filling',
    'two-step': 'Two changes in a row',
  },
  renderOption: renderPatternOption,
  describeOption: describePatternOption,
});
