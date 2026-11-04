import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { describePatternOption, renderPatternOption } from '../shared/ui';
import { ruleDiscoveryGame } from './content/definition';
import type { RuleDiscoveryChallenge } from './content/types';
import { RuleDiscoveryView } from './ui/RuleDiscoveryView';

export const ruleDiscoveryModule = defineGameModule<RuleDiscoveryChallenge>({
  definition: ruleDiscoveryGame,
  ContentView: RuleDiscoveryView,
  kindLabels: {
    move: msg('patterns:ruleBasedPatternDiscovery.kinds.move'),
    colour: msg('patterns:ruleBasedPatternDiscovery.kinds.colour'),
    gather: msg('patterns:ruleBasedPatternDiscovery.kinds.gather'),
    'two-step': msg('patterns:ruleBasedPatternDiscovery.kinds.two-step'),
  },
  renderOption: renderPatternOption,
  describeOption: describePatternOption,
});
