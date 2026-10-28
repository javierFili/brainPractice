import { defineGameModule } from '../../types';
import { ruleDiscoveryGame } from './content/definition';
import type { RuleChallenge } from './content/types';
import { renderRuleOption } from './ui/renderRuleOption';
import { RuleDiscoveryView } from './ui/RuleDiscoveryView';

export const ruleDiscoveryModule = defineGameModule<RuleChallenge>({
  definition: ruleDiscoveryGame,
  ContentView: RuleDiscoveryView,
  kindLabels: { glyphs: 'Shape rules', numbers: 'Number rules' },
  renderOption: renderRuleOption,
});
