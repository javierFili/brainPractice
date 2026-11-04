import { useTranslation } from 'react-i18next';
import { msg } from '@/domain/shared';
import type { ContentViewProps } from '@/games/types';
import { useText } from '@/i18n';
import { describeGrid } from '../../shared/content';
import { TileGridFigure } from '../../shared/ui';
import { STEP_WORDS } from '../content/definition';
import type { SpatialTransformChallenge, Step } from '../content/types';

const ICON: Record<Step, string> = {
  cw: '↻',
  ccw: '↺',
  '180': '⟲',
  'flip-lr': '⇆',
  'flip-ud': '⇅',
};

export function SpatialTransformView({ challenge }: ContentViewProps<SpatialTransformChallenge>) {
  const { t } = useTranslation('patterns');
  const tx = useText();
  const { grid, steps } = challenge.content;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
      <TileGridFigure
        grid={grid}
        label={msg('patterns:spatialTransformation.view.start', { grid: describeGrid(grid) })}
        className="w-36 sm:w-44"
      />
      <ol aria-label={t('spatialTransformation.view.moves')} className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-lg border border-line bg-raised px-3 py-2 text-ink"
          >
            <span aria-hidden="true" className="text-2xl text-glow">
              {ICON[step]}
            </span>
            <span>
              {steps.length > 1 && <span className="text-ink-muted">{i + 1}. </span>}
              {tx(STEP_WORDS[step])}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
