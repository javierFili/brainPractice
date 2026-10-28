import { locateResponse, multiSelectResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, sample, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import {
  COLORS,
  distinctGlyphs,
  glyphLabel,
  sameGlyph,
  SHAPES,
  type ColorName,
  type Glyph,
  type ShapeKind,
} from '@/games/kit/content';
import { cellName } from '../../shared/content';
import { VISUAL_CHANGES_LEVELS } from './levels';
import type { VisualChangesChallenge, VisualChangesContent, VisualChangesProfile } from './types';

interface Palette {
  readonly shapes: readonly ShapeKind[];
  readonly colors: readonly ColorName[];
}

function glyphsFor(random: RandomGenerator, profile: VisualChangesProfile, palette: Palette) {
  if (profile.palette === 'distinct') return distinctGlyphs(random, profile.items);
  return Array.from({ length: profile.items }, () => ({
    shape: pick(random, palette.shapes),
    color: pick(random, palette.colors),
  }));
}

/** Cells that differ between two arrangements: the verifier of every generated change. */
export const differences = (a: readonly (Glyph | null)[], b: readonly (Glyph | null)[]) =>
  a.flatMap((glyph, i) => {
    const other = b[i] ?? null;
    if (glyph === null || other === null) return glyph === other ? [] : [i];
    return sameGlyph(glyph, other) ? [] : [i];
  });

function build(
  random: RandomGenerator,
  profile: VisualChangesProfile,
  kind: VisualChangesContent['kind'],
): VisualChangesContent | null {
  const palette: Palette =
    profile.palette === 'similar'
      ? { shapes: sample(random, SHAPES, 3), colors: sample(random, COLORS, 3) }
      : { shapes: SHAPES, colors: COLORS };
  const glyphs = glyphsFor(random, profile, palette);
  const count = profile.size * profile.size;
  const cells = sample(
    random,
    Array.from({ length: count }, (_, i) => i),
    profile.items,
  );
  const before: (Glyph | null)[] = Array.from({ length: count }, () => null);
  cells.forEach((cell, i) => (before[cell] = glyphs[i] as Glyph));
  const after = [...before];
  if (kind === 'swap') {
    const [a, b] = sample(random, cells, 2) as [number, number];
    [after[a], after[b]] = [before[b] as Glyph, before[a] as Glyph];
  } else {
    const cell = pick(random, cells);
    const old = before[cell] as Glyph;
    after[cell] =
      kind === 'color'
        ? {
            ...old,
            color: pick(
              random,
              palette.colors.filter((c) => c !== old.color),
            ),
          }
        : {
            ...old,
            shape: pick(
              random,
              palette.shapes.filter((s) => s !== old.shape),
            ),
          };
  }
  const changed = differences(before, after);
  // A swap of two identical glyphs would be invisible: reject it.
  if (changed.length !== (kind === 'swap' ? 2 : 1)) return null;
  return { kind, size: profile.size, before, after, changed };
}

export const VISUAL_CHANGES_ID = gameIdOf('visual-changes');

export const visualChangesGame: GameDefinition<VisualChangesChallenge, VisualChangesProfile> = {
  id: VISUAL_CHANGES_ID,
  name: 'Visual Changes',
  tagline: 'Something is different. What?',
  description:
    'Look at a grid of shapes. It disappears and comes back with one difference: a shape changed colour or form, or — at higher levels — two shapes swapped places. Point at what changed.',
  area: 'memory',
  skills: ['visual-memory', 'error-detection', 'selective-attention'],
  meta: {
    category: 'memory',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'grid',
    estimatedMinutes: 3,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'An answer counts when you point at the changed shape (or both swapped shapes). Your result is the share of changes found; answering is not timed.',
    feedback: 'brief',
  },
  instructions: [
    'Look at the shapes and where they are. Press “I’m ready” when you have them.',
    'The grid comes back with exactly one change: tap the shape that changed.',
    'From level 7, two shapes may swap places instead: mark both, then press Check.',
    'Keyboard: arrow keys move between cells, Enter chooses one.',
  ],
  simpleInstructions: 'Remember the picture, then tap what changed.',
  levels: VISUAL_CHANGES_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    const content = retryGeneration('visible change', () => build(random, profile, kind));
    const { before, after, changed, size } = content;
    const cells = size * size;
    const where = changed.map((i) => cellName(i, size));
    const first = changed[0] as number;
    return {
      ...identity,
      prompt:
        kind === 'swap' ? 'Two shapes swapped places. Mark both.' : 'One shape changed. Which one?',
      studyPrompt: 'Remember the shapes and where they are.',
      content,
      response:
        kind === 'swap' ? multiSelectResponse(cells, changed) : locateResponse(cells, first),
      explanation:
        kind === 'swap'
          ? `The ${glyphLabel(before[first] as Glyph)} and the ${glyphLabel(before[changed[1] as number] as Glyph)} swapped (${where.join(' and ')}).`
          : `At ${where[0] ?? ''}, the ${glyphLabel(before[first] as Glyph)} became a ${glyphLabel(after[first] as Glyph)}.`,
      skills:
        kind === 'swap'
          ? ['visual-memory', 'spatial-reasoning']
          : ['visual-memory', 'error-detection'],
      timing: profile.timing,
    };
  },
};
