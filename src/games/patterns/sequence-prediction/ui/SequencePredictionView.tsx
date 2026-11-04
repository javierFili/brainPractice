import { useTranslation } from 'react-i18next';
import { msg } from '@/domain/shared';
import type { ContentViewProps } from '@/games/types';
import { Missing } from '../../shared/ui';
import { frameWords } from '../content/frames';
import type { SequencePredictionChallenge } from '../content/types';
import { FrameGrid } from './FrameGrid';

export function SequencePredictionView({
  challenge,
}: ContentViewProps<SequencePredictionChallenge>) {
  const { t } = useTranslation('patterns');
  const { frames, size, wrap } = challenge.content;
  return (
    <div className="flex flex-col items-center gap-3">
      <ol
        aria-label={t('sequencePrediction.view.frames')}
        className="flex flex-wrap items-end justify-center gap-3"
      >
        {frames.map((frame, i) => (
          <li key={i} className="flex flex-col items-center gap-1">
            <span className="text-xs text-ink-muted">
              {t('sequencePrediction.view.frame', { index: i + 1 })}
            </span>
            <FrameGrid
              frame={frame}
              size={size}
              label={msg('patterns:sequencePrediction.view.frameLabel', {
                index: i + 1,
                marks: frameWords(frame),
              })}
            />
          </li>
        ))}
        <li className="flex flex-col items-center gap-1">
          <span className="text-xs text-ink-muted">{t('sequencePrediction.view.next')}</span>
          <Missing
            label={t('sequencePrediction.view.nextFrame')}
            className="h-20 w-20 sm:h-24 sm:w-24"
          />
        </li>
      </ol>
      {wrap && (
        <p className="text-sm text-ink-muted">
          <span aria-hidden="true">↺ </span>
          {t('sequencePrediction.view.wrap')}
        </p>
      )}
    </div>
  );
}
