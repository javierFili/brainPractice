import { pick, type RandomGenerator } from '@/domain/random';
import { COLORS, SHAPES, type ColorName, type ShapeKind } from '@/games/kit/content';

/**
 * A mark is a kit glyph (shape + colour) in a pose, plus one asymmetric shape (`ell`, an L) so
 * that mirroring can matter. Two marks that differ only by a pose the shape is symmetric under
 * look identical; `canonicalMark` folds those away so uniqueness checks compare what is seen.
 */
export type MarkShape = ShapeKind | 'ell';
export type Rotation = 0 | 90 | 180 | 270;

export interface Mark {
  readonly shape: MarkShape;
  readonly color: ColorName;
  readonly rotation: Rotation;
  readonly mirrored: boolean;
}

export const ROTATIONS: readonly Rotation[] = [0, 90, 180, 270];

/** Shapes whose four quarter turns all look different (triangle, heart, star point one way). */
export const TURNING_SHAPES: readonly MarkShape[] = ['triangle', 'heart', 'star', 'ell'];

/** Looks the same in every pose. */
const FULLY_SYMMETRIC = new Set<MarkShape>(['circle', 'square', 'diamond', 'cross']);
/** Left-right symmetric: mirroring changes nothing (only the rotation is visible). */
const MIRROR_SYMMETRIC = new Set<MarkShape>(['triangle', 'heart', 'star', 'hexagon']);

export const mark = (
  shape: MarkShape,
  color: ColorName,
  rotation: Rotation = 0,
  mirrored = false,
): Mark => ({ shape, color, rotation, mirrored });

/** The visually equivalent mark with the simplest pose. */
export function canonicalMark(m: Mark): Mark {
  if (FULLY_SYMMETRIC.has(m.shape)) return { ...m, rotation: 0, mirrored: false };
  if (m.shape === 'hexagon')
    return { ...m, rotation: (m.rotation % 180) as Rotation, mirrored: false };
  if (MIRROR_SYMMETRIC.has(m.shape)) return { ...m, mirrored: false };
  return m;
}

export function markKey(m: Mark): string {
  const c = canonicalMark(m);
  return `${c.color}-${c.shape}-${c.rotation}${c.mirrored ? '-m' : ''}`;
}

export const sameLook = (a: Mark, b: Mark): boolean => markKey(a) === markKey(b);

export const shapeName = (shape: MarkShape): string => (shape === 'ell' ? 'L shape' : shape);

const TURN_WORDS: Record<Rotation, string> = {
  0: 'upright',
  90: 'turned right',
  180: 'upside down',
  270: 'turned left',
};

/** "turned right, mirrored"; empty for the default pose or a pose the shape cannot show. */
export function poseWords(m: Mark): string {
  const c = canonicalMark(m);
  const words: string[] = [];
  if (c.rotation !== 0) words.push(TURN_WORDS[c.rotation]);
  if (c.mirrored) words.push('mirrored');
  return words.join(', ');
}

/** Spoken name that differs whenever the look differs: "blue triangle, upside down". */
export function markLabel(m: Mark): string {
  const pose = poseWords(m);
  return `${m.color} ${shapeName(m.shape)}${pose === '' ? '' : `, ${pose}`}`;
}

/** Plural description of a shape: "triangles", "L shapes". */
export const shapePlural = (shape: MarkShape): string => `${shapeName(shape)}s`;

export const turnWord = (rotation: Rotation): string => TURN_WORDS[rotation];

export const randomColor = (random: RandomGenerator, except: readonly ColorName[] = []) =>
  pick(
    random,
    COLORS.filter((c) => !except.includes(c)),
  );

export const randomShape = (
  random: RandomGenerator,
  from: readonly MarkShape[] = SHAPES,
  except: readonly MarkShape[] = [],
) =>
  pick(
    random,
    from.filter((s) => !except.includes(s)),
  );

/** Colours that are easy to confuse, for subtle differences (each has at least one neighbour). */
export const NEAR_COLORS: Readonly<Record<ColorName, readonly ColorName[]>> = {
  red: ['orange', 'purple'],
  orange: ['red', 'yellow'],
  yellow: ['orange', 'green'],
  green: ['yellow', 'blue'],
  blue: ['purple', 'green'],
  purple: ['blue', 'red'],
};

/** Shapes with similar outlines, for subtle differences. */
export const NEAR_SHAPES: Readonly<Record<ShapeKind, readonly ShapeKind[]>> = {
  circle: ['hexagon'],
  hexagon: ['circle'],
  square: ['diamond'],
  diamond: ['square'],
  star: ['cross'],
  cross: ['star'],
  heart: ['triangle'],
  triangle: ['heart'],
};

export type Change = 'color' | 'shape' | 'turn' | 'mirror';

/**
 * A mark that differs from `m` in exactly one visible feature. `subtle` picks the nearest colour
 * or outline. Returns null when the change is impossible for this mark (e.g. turning a circle).
 */
export function changeMark(
  random: RandomGenerator,
  m: Mark,
  change: Change,
  subtle = false,
): Mark | null {
  let next: Mark;
  switch (change) {
    case 'color':
      next = {
        ...m,
        color: subtle ? pick(random, NEAR_COLORS[m.color]) : randomColor(random, [m.color]),
      };
      break;
    case 'shape': {
      if (m.shape === 'ell') return null;
      const shape = subtle
        ? pick(random, NEAR_SHAPES[m.shape])
        : randomShape(random, SHAPES, [m.shape]);
      next = { ...m, shape, rotation: 0, mirrored: false };
      break;
    }
    case 'turn': {
      const options = ROTATIONS.filter((r) => r !== m.rotation);
      const rotation =
        subtle && m.rotation % 180 === 0 ? pick(random, [90, 270] as const) : pick(random, options);
      next = { ...m, rotation };
      break;
    }
    case 'mirror':
      next = { ...m, mirrored: !m.mirrored };
      break;
  }
  return sameLook(next, m) ? null : next;
}
