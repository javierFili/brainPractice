import { useTranslation } from 'react-i18next';
import { msg } from '@/domain/shared';
import type { ContentViewProps } from '@/games/types';
import { describeGrid } from '../../shared/content';
import { TileGridFigure } from '../../shared/ui';
import type { ShapeRotationChallenge } from '../content/types';

export function ShapeRotationView({ challenge }: ContentViewProps<ShapeRotationChallenge>) {
  const { t } = useTranslation('patterns');
  const { piece } = challenge.content;
  return (
    <figure className="flex flex-col items-center gap-2">
      <TileGridFigure
        grid={piece}
        label={msg('patterns:shapeRotation.view.piece', { grid: describeGrid(piece) })}
        className="w-28 sm:w-36"
      />
      <figcaption className="text-sm text-ink-muted">
        {challenge.content.kind === 'mirrors'
          ? t('shapeRotation.view.mirrors')
          : t('shapeRotation.view.pieces')}
      </figcaption>
    </figure>
  );
}
