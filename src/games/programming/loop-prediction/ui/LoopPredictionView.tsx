import { useTranslation } from 'react-i18next';
import type { ContentViewProps } from '@/games/types';
import { ProgramPanel } from '../../shared/ui';
import type { LoopChallenge } from '../content/types';

export function LoopPredictionView({ challenge, phase }: ContentViewProps<LoopChallenge>) {
  const { t } = useTranslation('programming');
  const { source, line, ask, kind } = challenge.content;
  return (
    <ProgramPanel
      source={source}
      phase={phase}
      label={t('loopPrediction.view.label')}
      {...(line === null ? {} : { highlight: [line] })}
      caption={
        kind === 'iterations'
          ? t('loopPrediction.view.count', { line: line ?? '' })
          : kind === 'final-value'
            ? ask === null
              ? t('loopPrediction.view.followVariable')
              : t('loopPrediction.view.follow', { name: ask })
            : t('loopPrediction.view.output')
      }
    />
  );
}
