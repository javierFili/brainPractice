import { COLORS } from '@/games/kit/content';
import { FIGURE_SHAPES, type Figure } from '../../shared/content';

/** A property a panel can have. The library is used to check that only one panel stands out. */
export interface PanelPredicate {
  readonly id: string;
  readonly holds: (panel: readonly Figure[]) => boolean;
}

const distinct = (values: readonly unknown[]) => new Set(values).size;
const colours = (p: readonly Figure[]) => p.map((f) => f.color);
const shapes = (p: readonly Figure[]) => p.map((f) => f.shape);

export const sameColour = (p: readonly Figure[]) => distinct(colours(p)) === 1;
export const sameShape = (p: readonly Figure[]) => distinct(shapes(p)) === 1;
export const differentShapes = (p: readonly Figure[]) => distinct(shapes(p)) === p.length;
export const differentColours = (p: readonly Figure[]) => distinct(colours(p)) === p.length;
export const sameDirection = (p: readonly Figure[]) =>
  distinct(p.filter((f) => f.shape === 'arrow' || f.shape === 'triangle').map((f) => f.rotation)) <=
  1;
/** All figures share one colour except exactly one. */
export function oneOddColour(p: readonly Figure[]) {
  const counts = [...new Set(colours(p))].map((c) => colours(p).filter((x) => x === c).length);
  return p.length >= 3 && counts.length === 2 && counts.includes(1);
}
export function mirrorOrder(p: readonly Figure[]) {
  return p.every((f, i) => {
    const g = p[p.length - 1 - i] as Figure;
    return f.shape === g.shape && f.color === g.color && f.rotation === g.rotation;
  });
}

const BASE: readonly PanelPredicate[] = [
  { id: 'same-colour', holds: sameColour },
  { id: 'same-shape', holds: sameShape },
  { id: 'different-shapes', holds: differentShapes },
  { id: 'different-colours', holds: differentColours },
  { id: 'same-direction', holds: sameDirection },
  { id: 'one-odd-colour', holds: oneOddColour },
  { id: 'mirror-order', holds: mirrorOrder },
  ...[1, 2, 3, 4, 5].map((n) => ({
    id: `count-${n}`,
    holds: (p: readonly Figure[]) => p.length === n,
  })),
  ...FIGURE_SHAPES.map((s) => ({
    id: `contains-${s}`,
    holds: (p: readonly Figure[]) => p.some((f) => f.shape === s),
  })),
  ...COLORS.map((c) => ({
    id: `contains-${c}`,
    holds: (p: readonly Figure[]) => p.some((f) => f.color === c),
  })),
  { id: 'all-arrows', holds: (p) => p.every((f) => f.shape === 'arrow') },
];

/** Every predicate and its opposite ("the only panel that…" is as valid a reading as "all but one"). */
export const PANEL_LIBRARY: readonly PanelPredicate[] = BASE.flatMap((p) => [
  p,
  { id: `not-${p.id}`, holds: (panel: readonly Figure[]) => !p.holds(panel) },
]);

/** Which base predicates a panel satisfies (cache it while a panel does not change). */
export const signature = (panel: readonly Figure[]): boolean[] => BASE.map((p) => p.holds(panel));

/**
 * Panels singled out by some predicate or its opposite: the only panel that breaks a property all
 * the others share, or the only one that has it.
 */
export function singledOut(
  signatures: readonly (readonly boolean[])[],
): { readonly panel: number; readonly id: string }[] {
  const found: { panel: number; id: string }[] = [];
  BASE.forEach(({ id }, k) => {
    const holding: number[] = [];
    const failing: number[] = [];
    signatures.forEach((sig, i) => (sig[k] ? holding : failing).push(i));
    if (failing.length === 1) found.push({ panel: failing[0] as number, id });
    if (holding.length === 1) found.push({ panel: holding[0] as number, id });
  });
  return found;
}

export function oddPanels(
  panels: readonly (readonly Figure[])[],
  signatures: readonly (readonly boolean[])[] = panels.map(signature),
): Set<number> {
  return new Set(singledOut(signatures).map((s) => s.panel));
}
