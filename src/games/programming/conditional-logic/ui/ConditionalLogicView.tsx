import { useTranslation } from 'react-i18next';
import type { ContentViewProps } from '@/games/types';
import { ProgramPanel } from '../../shared/ui';
import type { ConditionalChallenge } from '../content/types';

export function ConditionalLogicView({ challenge, phase }: ContentViewProps<ConditionalChallenge>) {
  const { t } = useTranslation('programming');
  const { source, inputs, target, kind } = challenge.content;
  const inputCount = inputs === null ? 0 : Object.keys(inputs).length;
  return (
    <ProgramPanel
      source={source}
      phase={phase}
      label={t('conditionalLogic.view.label')}
      caption={
        target !== null
          ? t('conditionalLogic.view.fromOptions', { target })
          : kind === 'short-circuit'
            ? t('conditionalLogic.view.inputsDivision', { count: inputCount })
            : t('conditionalLogic.view.inputs', { count: inputCount })
      }
      // For find-input the trace would need a chosen input; the explanation covers it instead.
      trace={inputs !== null}
    />
  );
}
