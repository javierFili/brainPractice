import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { ruleDiscoveryGame } from './content/definition';
import type { RuleChallenge } from './content/types';
import { renderRuleOption } from './ui/renderRuleOption';
import { RuleDiscoveryView } from './ui/RuleDiscoveryView';

export const ruleDiscoveryModule = defineGameModule<RuleChallenge>({
  definition: ruleDiscoveryGame,
  ContentView: RuleDiscoveryView,
  kindLabels: {
    glyphs: msg('logic:ruleDiscovery.kinds.glyphs'),
    numbers: msg('logic:ruleDiscovery.kinds.numbers'),
  },
  renderOption: renderRuleOption,
});
