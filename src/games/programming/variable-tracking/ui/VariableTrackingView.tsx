import { useTranslation } from 'react-i18next';
import type { ContentViewProps } from '@/games/types';
import { ProgramPanel } from '../../shared/ui';
import type { TrackingChallenge } from '../content/types';

export function VariableTrackingView({ challenge, phase }: ContentViewProps<TrackingChallenge>) {
  const { t } = useTranslation('programming');
  const { source, line, ask, variables } = challenge.content;
  return (
    <ProgramPanel
      source={source}
      phase={phase}
      label={t('variableTracking.view.label')}
      {...(line === null ? {} : { highlight: [line] })}
      caption={
        ask === null
          ? t('variableTracking.view.compare', { names: variables.join(', ') })
          : line === null
            ? t('variableTracking.view.track', { name: ask })
            : t('variableTracking.view.stop', { line })
      }
    />
  );
}
