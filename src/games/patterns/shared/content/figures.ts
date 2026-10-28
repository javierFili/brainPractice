import { COLORS, SHAPES, type ColorName, type ShapeKind } from '@/games/kit/content';

/**
 * A figure: `count` copies of a coloured shape. Arrows and triangles point somewhere, so their
 * rotation (clockwise, 0 = pointing up) is part of what they look like; other shapes ignore it.
 */
export type FigureShape = ShapeKind | 'arrow';
export type Rotation = 0 | 90 | 180 | 270;

export interface Figure {
  readonly shape: FigureShape;
  readonly color: ColorName;
  readonly count: number;
  readonly rotation: Rotation;
}

export const FIGURE_SHAPES: readonly FigureShape[] = [...SHAPES, 'arrow'];
export const POINTING_SHAPES: readonly FigureShape[] = ['arrow', 'triangle'];
export const ROTATION_VALUES: readonly Rotation[] = [0, 90, 180, 270];

export const isPointing = (shape: FigureShape) => POINTING_SHAPES.includes(shape);

export const DIRECTION: Record<Rotation, string> = {
  0: 'up',
  90: 'right',
  180: 'down',
  270: 'left',
};

export const turn = (rotation: number, by: number): Rotation =>
  ((((rotation + by) % 360) + 360) % 360) as Rotation;

const plural = (shape: FigureShape, count: number) =>
  count === 1 ? shape : shape === 'cross' ? 'crosses' : `${shape}s`;

export const figure = (
  shape: FigureShape,
  color: ColorName,
  count = 1,
  rotation: Rotation = 0,
): Figure => ({ shape, color, count, rotation: isPointing(shape) ? rotation : 0 });

/** `2 blue arrows pointing right`; the count is left out for a single figure. */
export function figureLabel(f: Figure, { withCount = true } = {}): string {
  const base = `${withCount ? `${f.count} ` : ''}${f.color} ${plural(f.shape, withCount ? f.count : 1)}`;
  return isPointing(f.shape) ? `${base} pointing ${DIRECTION[f.rotation]}` : base;
}

export const figureKey = (f: Figure) => figureLabel(f);
export const sameFigure = (a: Figure, b: Figure) => figureKey(a) === figureKey(b);

/** Inverse of `figureLabel`; null for other labels. */
export function parseFigure(label: string): Figure | null {
  const words = label.split(' ');
  const count = /^\d$/.test(words[0] ?? '') ? Number(words.shift()) : 1;
  const [color, name, pointing, direction, ...extra] = words;
  if (extra.length > 0 || !(COLORS as readonly string[]).includes(color ?? '')) return null;
  const shape = FIGURE_SHAPES.find((s) => s === name || plural(s, 2) === name);
  if (shape === undefined || plural(shape, count) !== name) return null;
  if (isPointing(shape) !== (pointing === 'pointing')) return null;
  const rotation = isPointing(shape) ? ROTATION_VALUES.find((r) => DIRECTION[r] === direction) : 0;
  if (rotation === undefined) return null;
  return figure(shape, color as ColorName, count, rotation);
}
