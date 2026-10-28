import type { ColorName } from '@/games/kit/content';
import { Glyph } from '@/games/kit/ui';
import { markLabel, type Mark } from '../content/marks';

const FILL: Record<ColorName, string> = {
  red: 'fill-glyph-red',
  orange: 'fill-glyph-orange',
  yellow: 'fill-glyph-yellow',
  green: 'fill-glyph-green',
  blue: 'fill-glyph-blue',
  purple: 'fill-glyph-purple',
};

/** An L: a tall bar with a foot to the right. Asymmetric, so every pose looks different. */
const ELL_PATH = 'M22 8h26v56h32v28H22Z';

interface Props {
  readonly mark: Mark;
  readonly className?: string;
  /** Labelled marks announce their name; by default the surrounding cell carries the label. */
  readonly labelled?: boolean;
}

/** Draws a mark: kit glyphs with their pose, or the asymmetric L shape. */
export function MarkFace({ mark, className = 'h-4/5 w-4/5', labelled = false }: Props) {
  const pose = { rotation: mark.rotation, mirrored: mark.mirrored };
  const face =
    mark.shape === 'ell' ? (
      <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
        <path
          d={ELL_PATH}
          transform={`rotate(${mark.rotation} 50 50)${mark.mirrored ? ' translate(100 0) scale(-1 1)' : ''}`}
          className={`${FILL[mark.color]} stroke-canvas`}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      <Glyph
        glyph={{ shape: mark.shape, color: mark.color }}
        pose={pose}
        className={className}
        decorative
      />
    );
  if (!labelled) return face;
  return (
    <span
      role="img"
      aria-label={markLabel(mark)}
      className="inline-flex items-center justify-center"
    >
      {face}
    </span>
  );
}
