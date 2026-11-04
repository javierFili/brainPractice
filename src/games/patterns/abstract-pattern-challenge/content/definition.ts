import { retryGeneration, type GameDefinition } from '@/domain/game';
import {
  pick,
  randomInt,
  sample,
  shuffle,
  weightedPick,
  type RandomGenerator,
} from '@/domain/random';
import { gameIdOf, joinText, msg, type Message, type Text } from '@/domain/shared';

const T = 'patterns:abstractPatternChallenge';
import { colorLabel, COLORS, SHAPES, type ColorName } from '@/games/kit/content';
import {
  DIRECTION,
  FIGURE_SHAPES,
  figure,
  figureKey,
  figureLabel,
  orderedChoice,
  ROTATION_VALUES,
  type Draft,
  type Figure,
  type FigureShape,
} from '../../shared/content';
import { ABSTRACT_LEVELS } from './levels';
import {
  differentColours,
  differentShapes,
  mirrorOrder,
  oddPanels,
  oneOddColour,
  sameColour,
  sameDirection,
  sameShape,
  signature,
  singledOut,
} from './rules';
import type { AbstractChallenge, AbstractContent, AbstractProfile, PanelRule } from './types';

export const ABSTRACT_ID = gameIdOf('abstract-pattern-challenge');

const PLAIN: readonly FigureShape[] = SHAPES.filter((s) => s !== 'triangle');

const KIND: Record<PanelRule, AbstractContent['kind']> = {
  'same-colour': 'colour',
  'different-colours': 'colour',
  'one-odd-colour': 'colour',
  'same-shape': 'shape',
  'different-shapes': 'shape',
  'contains-shape': 'shape',
  'same-count': 'count',
  'same-direction': 'direction',
  'mirror-order': 'order',
};

/** Predicates (by id or id prefix) that may also single out the odd panel, per rule family. */
const FAMILY: Record<AbstractContent['kind'], readonly string[]> = {
  colour: [
    'same-colour',
    'different-colours',
    'one-odd-colour',
    ...COLORS.map((c) => `contains-${c}`),
  ],
  shape: ['same-shape', 'different-shapes', ...FIGURE_SHAPES.map((sh) => `contains-${sh}`)],
  count: ['count'],
  direction: ['same-direction'],
  order: ['mirror-order'],
};

/** Panel sizes in which no size appears only once, so size alone never points at a panel. */
function sizesFor(random: RandomGenerator, panels: number, min: number, max: number): number[] {
  const choices = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  if (choices.length === 1 || panels < 4) return Array.from({ length: panels }, () => min);
  const split = randomInt(random, 2, panels - 2);
  const [a, b] = sample(random, choices, 2) as [number, number];
  const sizes = Array.from({ length: panels }, (_, i) => (i < split ? a : b));
  return shuffle(random, sizes);
}

interface Palette {
  readonly shapes: readonly FigureShape[];
  readonly colors: readonly ColorName[];
}

const randomFigure = (random: RandomGenerator, p: Palette) =>
  figure(pick(random, p.shapes), pick(random, p.colors));

const others = <V>(values: readonly V[], not: V) => values.filter((v) => v !== not);

/** Builds one panel of `size` figures that follows (`valid`) or breaks the rule. */
function panelFor(
  random: RandomGenerator,
  rule: PanelRule,
  size: number,
  valid: boolean,
  p: Palette,
  target: FigureShape,
): Figure[] {
  const free = () => Array.from({ length: size }, () => randomFigure(random, p));
  const replaceOne = (panel: Figure[], change: (f: Figure) => Figure) => {
    const i = randomInt(random, 0, panel.length - 1);
    return panel.map((f, j) => (j === i ? change(f) : f));
  };
  switch (rule) {
    case 'same-colour': {
      const c = pick(random, p.colors);
      const panel = free().map((f) => figure(f.shape, c));
      return valid
        ? panel
        : replaceOne(panel, (f) => figure(f.shape, pick(random, others(p.colors, c))));
    }
    case 'same-shape': {
      const s = pick(random, p.shapes);
      const panel = free().map((f) => figure(s, f.color));
      return valid
        ? panel
        : replaceOne(panel, (f) => figure(pick(random, others(p.shapes, s)), f.color));
    }
    case 'different-shapes':
    case 'different-colours': {
      const byShape = rule === 'different-shapes';
      const values = byShape ? sample(random, p.shapes, size) : sample(random, p.colors, size);
      if (!valid) values[0] = values[1] as (typeof values)[number];
      const ordered = shuffle(random, values);
      return ordered.map((v) =>
        byShape
          ? figure(v as FigureShape, pick(random, p.colors))
          : figure(pick(random, p.shapes), v as ColorName),
      );
    }
    case 'same-count':
      return free();
    case 'contains-shape': {
      const rest = others(p.shapes, target);
      const panel = Array.from({ length: size }, () =>
        figure(pick(random, valid ? p.shapes : rest), pick(random, p.colors)),
      );
      if (!valid) return panel;
      const i = randomInt(random, 0, size - 1);
      return panel.map((f, j) => (j === i ? figure(target, f.color) : f));
    }
    case 'same-direction': {
      const r = pick(random, ROTATION_VALUES);
      const panel = Array.from({ length: size }, () =>
        figure('arrow', pick(random, p.colors), 1, r),
      );
      return valid
        ? panel
        : replaceOne(panel, (f) =>
            figure('arrow', f.color, 1, pick(random, others(ROTATION_VALUES, r))),
          );
    }
    case 'one-odd-colour': {
      const [c, d, e] = sample(random, p.colors, 3) as [ColorName, ColorName, ColorName];
      const odd = randomInt(random, 0, size - 1);
      const panel = Array.from({ length: size }, (_, i) =>
        figure(pick(random, p.shapes), i === odd ? d : c),
      );
      if (valid) return panel;
      // Breaking it: no figure stands out, or more than one does.
      return random.next() < 0.5
        ? panel.map((f) => figure(f.shape, c))
        : panel.map((f, i) => (i === odd ? f : i === (odd + 1) % size ? figure(f.shape, e) : f));
    }
    case 'mirror-order': {
      const a = randomFigure(random, p);
      const b = pick(
        random,
        p.shapes
          .flatMap((sh) => p.colors.map((c) => figure(sh, c)))
          .filter((f) => figureKey(f) !== figureKey(a)),
      );
      const pal = size === 3 ? [a, b, a] : [a, b, b, a];
      if (valid) return pal;
      // Swap two neighbours that differ: same figures, no longer symmetric.
      const i = size === 3 ? pick(random, [0, 1]) : pick(random, [0, 2]);
      const swapped = [...pal];
      [swapped[i], swapped[i + 1]] = [pal[i + 1] as Figure, pal[i] as Figure];
      return swapped;
    }
  }
}

/** "every panel contains at least one circle": per-shape keys keep articles and gender right. */
const ruleText = (rule: PanelRule, target: FigureShape, count: number): Message =>
  rule === 'contains-shape'
    ? msg(`${T}.rule.contains-shape.${target}`)
    : rule === 'same-count'
      ? msg(`${T}.rule.same-count`, { count })
      : msg(`${T}.rule.${rule}`);

const unique = <V>(values: readonly V[]) => [...new Set(values)];

function breakText(
  rule: PanelRule,
  panel: readonly Figure[],
  target: FigureShape,
  n: number,
): Message {
  const B = `${T}.break`;
  switch (rule) {
    case 'same-colour':
      return msg(`${B}.mixes`, {
        list: joinText(unique(panel.map((f) => f.color)).map(colorLabel)),
      });
    case 'same-shape':
      return msg(`${B}.mixes`, {
        list: joinText(
          unique(panel.map((f) => f.shape)).map((s) => msg(`patterns:shared.shapes.${s}`)),
        ),
      });
    case 'different-shapes':
      return msg(`${B}.sameShape`);
    case 'different-colours':
      return msg(`${B}.sameColour`);
    case 'same-count':
      return msg(`${B}.count`, { count: panel.length, expected: n });
    case 'contains-shape':
      return msg(`${B}.contains.${target}`);
    case 'same-direction':
      return msg(`${B}.directions`, {
        list: joinText(
          unique(panel.map((f) => DIRECTION[f.rotation])).map((d) =>
            msg(`patterns:shared.direction.${d}`),
          ),
        ),
      });
    case 'one-odd-colour':
      return sameColour(panel) ? msg(`${B}.allSame`) : msg(`${B}.severalOdd`);
    case 'mirror-order':
      return msg(`${B}.order`);
  }
}

/** Does the panel follow the rule? Used by the generator's self-check and the tests. */
export function follows(rule: PanelRule, panel: readonly Figure[], target: FigureShape, n: number) {
  switch (rule) {
    case 'same-colour':
      return sameColour(panel);
    case 'same-shape':
      return sameShape(panel);
    case 'different-shapes':
      return differentShapes(panel);
    case 'different-colours':
      return differentColours(panel);
    case 'same-count':
      return panel.length === n;
    case 'contains-shape':
      return panel.some((f) => f.shape === target);
    case 'same-direction':
      return sameDirection(panel);
    case 'one-odd-colour':
      return oneOddColour(panel);
    case 'mirror-order':
      return mirrorOrder(panel);
  }
}

/** One candidate, or the reason it was rejected (kept for diagnostics). */
export function candidate(
  random: RandomGenerator,
  profile: AbstractProfile,
  rule: PanelRule = weightedPick(random, profile.rules),
): Draft<AbstractChallenge> | string {
  {
    const { panels: count, minFigures, maxFigures } = profile;
    const needsVariety = rule === 'different-shapes' || rule === 'different-colours';
    const palette: Palette = {
      shapes: sample(random, PLAIN, needsVariety ? maxFigures + 1 : 3),
      colors: sample(
        random,
        COLORS,
        needsVariety || rule === 'one-odd-colour' ? maxFigures + 1 : 3,
      ),
    };
    const target = pick(random, palette.shapes);
    const answer = randomInt(random, 0, count - 1);
    let sizes = sizesFor(random, count, minFigures, maxFigures);
    let n = 0;
    if (rule === 'same-count') {
      n = randomInt(random, minFigures, maxFigures);
      const odd = pick(
        random,
        [n - 1, n + 1].filter((s) => s >= 2 && s <= 4),
      );
      sizes = sizes.map((_, i) => (i === answer ? odd : n));
    }
    if (rule === 'mirror-order') sizes = sizes.map((s) => Math.max(3, Math.min(4, s)));
    const make = (i: number) =>
      panelFor(random, rule, sizes[i] as number, i !== answer, palette, target);
    const panels = sizes.map((_, i) => make(i));
    if (panels.some((p) => p.length < 2)) return 'degenerate';
    // Noise can make another panel stand out under some other rule: redraw that panel.
    // The odd panel may stand out only by features of the rule's own family, so that it is not
    // also "the only one with fewer colours" when the rule is about shapes.
    const signatures = panels.map(signature);
    const family = FAMILY[KIND[rule]];
    for (let repair = 0; repair < 24; repair++) {
      const stray = singledOut(signatures).find(
        (s) => s.panel !== answer || !family.some((f) => s.id === f || s.id.startsWith(`${f}-`)),
      );
      if (stray === undefined) break;
      panels[stray.panel] = make(stray.panel);
      signatures[stray.panel] = signature(panels[stray.panel] as Figure[]);
    }
    // The intended rule must hold for every panel but the answer, and no other rule of the
    // library (or its opposite) may single out a different panel.
    if (!panels.every((p, i) => follows(rule, p, target, n) === (i !== answer))) return 'rule';
    const odd = oddPanels(panels, signatures);
    if (odd.size !== 1 || !odd.has(answer)) return `other:${odd.size}`;
    const labels = panels.map((_, i) => msg(`${T}.panel`, { index: i + 1 }));
    return {
      prompt: msg(`${T}.prompt`),
      content: { kind: KIND[rule], panels },
      response: orderedChoice(labels, answer),
      explanation: msg(`${T}.explanation`, {
        rule: ruleText(rule, target, n),
        index: answer + 1,
        reason: breakText(rule, panels[answer] as Figure[], target, n),
      }),
      skills: ['abstraction', 'pattern-recognition', 'logical-reasoning'],
    };
  }
}

function draft(random: RandomGenerator, profile: AbstractProfile): Draft<AbstractChallenge> {
  return retryGeneration('abstract panels', () => {
    const built = candidate(random, profile);
    return typeof built === 'string' ? null : built;
  });
}

export const panelText = (panel: readonly Figure[]): Text =>
  joinText(
    panel.map((f) => figureLabel(f, { withCount: false })),
    ', ',
  );

export const abstractPatternGame: GameDefinition<AbstractChallenge, AbstractProfile> = {
  id: ABSTRACT_ID,
  name: msg('patterns:abstractPatternChallenge.name'),
  tagline: msg('patterns:abstractPatternChallenge.tagline'),
  description: msg('patterns:abstractPatternChallenge.description'),
  area: 'patterns',
  skills: ['abstraction', 'pattern-recognition', 'logical-reasoning', 'cognitive-flexibility'],
  meta: {
    category: 'patterns',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('patterns:abstractPatternChallenge.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('patterns:abstractPatternChallenge.instructions.1'),
    msg('patterns:abstractPatternChallenge.instructions.2'),
    msg('patterns:abstractPatternChallenge.instructions.3'),
  ],
  simpleInstructions: msg('patterns:abstractPatternChallenge.simpleInstructions'),
  levels: ABSTRACT_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...draft(random, profile), timing: profile.timing };
  },
};
