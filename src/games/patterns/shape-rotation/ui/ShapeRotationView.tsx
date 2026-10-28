import type { ContentViewProps } from '@/games/types';
import { describeGrid } from '../../shared/content';
import { TileGridFigure } from '../../shared/ui';
import type { ShapeRotationChallenge } from '../content/types';

export function ShapeRotationView({ challenge }: ContentViewProps<ShapeRotationChallenge>) {
  const { piece } = challenge.content;
  return (
    <figure className="flex flex-col items-center gap-2">
      <TileGridFigure
        grid={piece}
        label={`Piece to turn: ${describeGrid(piece)}`}
        className="w-28 sm:w-36"
      />
      <figcaption className="text-sm text-ink-muted">
        {challenge.content.kind === 'mirrors'
          ? 'Turn it, do not flip it: mirror images do not count.'
          : 'Find this piece, turned.'}
      </figcaption>
    </figure>
  );
}
