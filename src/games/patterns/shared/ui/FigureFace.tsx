import type { ColorName } from '@/games/kit/content';
import { Glyph } from '@/games/kit/ui';
import { figureLabel, type Figure } from '../content/figures';

const FILL: Record<ColorName, string> = {
  red: 'fill-glyph-red',
  orange: 'fill-glyph-orange',
  yellow: 'fill-glyph-yellow',
  green: 'fill-glyph-green',
  blue: 'fill-glyph-blue',
  purple: 'fill-glyph-purple',
};

const ARROW = 'M50 6 90 48H64v46H36V48H10Z';

/** One shape (kit glyph or arrow), turned by `rotation` degrees clockwise. Decorative. */
export function Shape({
  figure,
  className = 'h-8 w-8',
}: {
  readonly figure: Figure;
  readonly className?: string;
}) {
  if (figure.shape === 'arrow') {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
        <path
          d={ARROW}
          transform={`rotate(${figure.rotation} 50 50)`}
          className={`${FILL[figure.color]} stroke-canvas`}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <Glyph
      glyph={{ shape: figure.shape, color: figure.color }}
      pose={{ rotation: figure.rotation, mirrored: false }}
      className={className}
      decorative
    />
  );
}

/** `count` copies of a shape with the figure's words as its accessible name. */
export function FigureFace({
  figure,
  size = 'md',
  label = true,
}: {
  readonly figure: Figure;
  readonly size?: 'sm' | 'md';
  /** False when the name is already given by the surrounding element. */
  readonly label?: boolean;
}) {
  const shapeSize =
    size === 'sm'
      ? 'h-5 w-5'
      : figure.count >= 3
        ? 'h-6 w-6 sm:h-7 sm:w-7'
        : 'h-8 w-8 sm:h-9 sm:w-9';
  return (
    <span
      className="inline-flex max-w-24 flex-wrap items-center justify-center gap-0.5"
      {...(label ? { role: 'img', 'aria-label': figureLabel(figure) } : { 'aria-hidden': true })}
    >
      {Array.from({ length: figure.count }, (_, i) => (
        <Shape key={i} figure={figure} className={shapeSize} />
      ))}
    </span>
  );
}
