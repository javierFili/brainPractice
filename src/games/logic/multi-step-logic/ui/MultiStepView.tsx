import { useTranslation } from 'react-i18next';
import { ClueList, Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { comparisonTexts, factSentence } from '../content/text';
import type { MultiStepChallenge } from '../content/types';

export function MultiStepView({ challenge }: ContentViewProps<MultiStepChallenge>) {
  const { t } = useTranslation('logic');
  const { content } = challenge;
  const facts =
    content.kind === 'numbers'
      ? content.facts.map((f) => factSentence(f, content.theme, content.names))
      : comparisonTexts(content);
  return (
    <Panel title={t('multiStepLogic.view.title')}>
      <ClueList clues={facts} label={t('multiStepLogic.view.facts')} />
    </Panel>
  );
}
