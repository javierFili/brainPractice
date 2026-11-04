import type { ColorName, Glyph as GlyphSpec, Pose, ShapeKind } from '../content/visual';
import { useText } from '@/i18n';
import { glyphLabel } from '../content/visual';

const FILL: Record<ColorName, string> = {
  red: 'fill-glyph-red',
  orange: 'fill-glyph-orange',
  yellow: 'fill-glyph-yellow',
  green: 'fill-glyph-green',
  blue: 'fill-glyph-blue',
  purple: 'fill-glyph-purple',
};

/** Shapes on a 100×100 canvas. Each has a distinct silhouette, so colour is never required. */
const PATHS: Record<ShapeKind, string> = {
  circle: 'M50 10a40 40 0 1 0 0.01 0Z',
  square: 'M14 14h72v72H14Z',
  triangle: 'M50 10 90 86H10Z',
  diamond: 'M50 6 92 50 50 94 8 50Z',
  star: 'M50 6l12.9 27.6 30.1 3.5-22.3 20.6 6 29.8L50 72.4 23.3 87.5l6-29.8L7 37.1l30.1-3.5Z',
  hexagon: 'M28 10h44l22 40-22 40H28L6 50Z',
  heart: 'M50 88 14 52C2 40 6 18 26 16c10-1 18 5 24 14 6-9 14-15 24-14 20 2 24 24 12 36Z',
  cross: 'M36 8h28v28h28v28H64v28H36V64H8V36h28Z',
};

interface Props {
  readonly glyph: GlyphSpec;
  readonly pose?: Pose;
  /** Tailwind size classes; defaults to a comfortable tile size. */
  readonly className?: string;
  /** Decorative glyphs are hidden from assistive technology (their label is said elsewhere). */
  readonly decorative?: boolean;
}

export function Glyph({ glyph, pose, className = 'h-10 w-10', decorative = false }: Props) {
  const tx = useText();
  const transform = pose
    ? `rotate(${pose.rotation} 50 50)${pose.mirrored ? ' translate(100 0) scale(-1 1)' : ''}`
    : undefined;
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': tx(glyphLabel(glyph)) })}
    >
      <path
        d={PATHS[glyph.shape]}
        transform={transform}
        className={`${FILL[glyph.color]} stroke-canvas`}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </svg>
  );
}
