import { useTranslation } from 'react-i18next';
import { ClueList, Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { premiseTexts } from '../content/definition';
import type { ConditionalChallenge } from '../content/types';

export function ConditionalView({ challenge }: ContentViewProps<ConditionalChallenge>) {
  const { t } = useTranslation('logic');
  return (
    <Panel title={t('conditionalReasoning.view.title')}>
      <ClueList
        clues={premiseTexts(challenge.content)}
        label={t('conditionalReasoning.view.statements')}
      />
    </Panel>
  );
}
