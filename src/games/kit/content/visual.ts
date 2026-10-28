import { pick, sample, type RandomGenerator } from '@/domain/random';

/**
 * Visual vocabulary shared by every visual game. A glyph is always a shape *and* a colour, and its
 * label names both, so no task depends on colour vision alone: shapes stay distinguishable in
 * greyscale and screen readers announce "blue star".
 */
export const SHAPES = [
  'circle',
  'square',
  'triangle',
  'diamond',
  'star',
  'hexagon',
  'heart',
  'cross',
] as const;
export type ShapeKind = (typeof SHAPES)[number];

export const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const;
export type ColorName = (typeof COLORS)[number];

export interface Glyph {
  readonly shape: ShapeKind;
  readonly color: ColorName;
}

/** Rotation in degrees, clockwise; mirrored glyphs are flipped horizontally before rotating. */
export interface Pose {
  readonly rotation: 0 | 90 | 180 | 270;
  readonly mirrored: boolean;
}

export const glyphLabel = ({ shape, color }: Glyph): string => `${color} ${shape}`;
export const glyphKey = ({ shape, color }: Glyph): string => `${color}-${shape}`;
export const sameGlyph = (a: Glyph, b: Glyph): boolean =>
  a.shape === b.shape && a.color === b.color;

/** Every shape × colour combination. */
export const ALL_GLYPHS: readonly Glyph[] = SHAPES.flatMap((shape) =>
  COLORS.map((color) => ({ shape, color })),
);

/** `count` glyphs that differ in both shape and colour when possible (easiest to tell apart). */
export function distinctGlyphs(random: RandomGenerator, count: number): Glyph[] {
  if (count > ALL_GLYPHS.length) throw new RangeError(`At most ${ALL_GLYPHS.length} glyphs`);
  if (count <= COLORS.length) {
    const shapes = sample(random, SHAPES, count);
    const colors = sample(random, COLORS, count);
    return shapes.map((shape, i) => ({ shape, color: colors[i] as ColorName }));
  }
  return sample(random, ALL_GLYPHS, count);
}

/** A glyph that differs from `glyph` in exactly one feature. */
export function nearGlyph(random: RandomGenerator, glyph: Glyph): Glyph {
  return random.next() < 0.5
    ? {
        ...glyph,
        shape: pick(
          random,
          SHAPES.filter((s) => s !== glyph.shape),
        ),
      }
    : {
        ...glyph,
        color: pick(
          random,
          COLORS.filter((c) => c !== glyph.color),
        ),
      };
}

/**
 * Shapes whose appearance changes under rotation by 90° and mirroring are needed for rotation
 * tasks; the symmetric glyphs above are not. These are drawn as polyominoes on a grid instead.
 */
export type Cell = readonly [row: number, col: number];
