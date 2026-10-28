import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { COLORS, SHAPES, type ColorName, type ShapeKind } from '@/games/kit/content';
import {
  balancedDesign,
  constantStep,
  figure,
  turn,
  type Draft,
  type Figure,
  type Rotation,
} from '../../shared/content';
import { frameLabel, frameWords, stepWords } from './frames';
import { SEQUENCE_PREDICTION_LEVELS } from './levels';
import type { Frame, Mark, SequencePredictionChallenge, SequencePredictionProfile } from './types';

export const SEQUENCE_PREDICTION_ID = gameIdOf('sequence-prediction');

const PLAIN: readonly ShapeKind[] = SHAPES.filter((s) => s !== 'triangle');

interface Motion {
  readonly figure: Figure;
  readonly row: number;
  readonly col: number;
  readonly dr: number;
  readonly dc: number;
  readonly turnBy: number;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

function markAt(m: Motion, i: number, size: number, wrap: boolean): Mark | null {
  const row = m.row + m.dr * i;
  const col = m.col + m.dc * i;
  const fig = { ...m.figure, rotation: turn(m.figure.rotation, m.turnBy * i) };
  if (wrap) return { figure: fig, row: mod(row, size), col: mod(col, size) };
  if (row < 0 || col < 0 || row >= size || col >= size) return null;
  return { figure: fig, row, col };
}

function randomStep(random: RandomGenerator, profile: SequencePredictionProfile) {
  const { maxStep, diagonal } = profile;
  const value = () => {
    const n = randomInt(random, 1, maxStep);
    return random.next() < 0.5 ? n : -n;
  };
  if (diagonal && random.next() < 0.5) return { dr: value(), dc: value() };
  return random.next() < 0.5 ? { dr: 0, dc: value() } : { dr: value(), dc: 0 };
}

/** A start cell from which `frames` steps (answer included) stay inside the grid, when possible. */
function startFor(random: RandomGenerator, size: number, d: number, steps: number, wrap: boolean) {
  if (wrap || d === 0) return randomInt(random, 0, size - 1);
  const lo = d > 0 ? 0 : -d * steps;
  const hi = d > 0 ? size - 1 - d * steps : size - 1;
  return lo > hi ? -1 : randomInt(random, lo, hi);
}

function motions(random: RandomGenerator, profile: SequencePredictionProfile): Motion[] | null {
  const { kind, size, wrap, frames } = profile;
  const colors = sample(random, COLORS, 2);
  const shapes = sample(random, PLAIN, 2);
  const quarter = () => pick(random, [90, -90]);
  const arrow = (color: ColorName): Figure =>
    figure('arrow', color, 1, pick(random, [0, 90, 180, 270] as const));
  const moving = (fig: Figure, turnBy: number): Motion | null => {
    const { dr, dc } = randomStep(random, profile);
    const row = startFor(random, size, dr, frames, wrap);
    const col = startFor(random, size, dc, frames, wrap);
    return row < 0 || col < 0 ? null : { figure: fig, row, col, dr, dc, turnBy };
  };
  const plain = (i: 0 | 1) => figure(shapes[i] as ShapeKind, colors[i] as ColorName);
  const list = (() => {
    switch (kind) {
      case 'move':
        return [moving(plain(0), 0)];
      case 'rotate': {
        const centre = Math.floor(size / 2);
        const fig = arrow(colors[0] as ColorName);
        return [{ figure: fig, row: centre, col: centre, dr: 0, dc: 0, turnBy: quarter() }];
      }
      case 'move-rotate':
        return [moving(arrow(colors[0] as ColorName), quarter())];
      case 'two-marks':
        return [
          moving(plain(0), 0),
          profile.turning ? moving(arrow(colors[1] as ColorName), quarter()) : moving(plain(1), 0),
        ];
    }
  })();
  return list.every((m) => m !== null) ? list : null;
}

const sameCell = (a: Mark, b: Mark) => a.row === b.row && a.col === b.col;

/**
 * Independent solver: tracks each mark by its shape and colour, requires a constant step for its
 * row, column and direction over all frames (modulo the grid size when marks wrap), and returns
 * the frame those steps lead to; null when a step is not constant or the mark would leave the grid.
 */
export function solveFrames(frames: readonly Frame[], size: number, wrap: boolean): Frame | null {
  const first = frames[0];
  if (!first) return null;
  const marks: Mark[] = [];
  for (const mark of first.marks) {
    const track = frames.map((f) =>
      f.marks.find(
        (m) => m.figure.shape === mark.figure.shape && m.figure.color === mark.figure.color,
      ),
    );
    if (track.some((m) => m === undefined)) return null;
    const ms = track as Mark[];
    const modulo = wrap ? size : null;
    const dr = constantStep(
      ms.map((m) => m.row),
      modulo,
    );
    const dc = constantStep(
      ms.map((m) => m.col),
      modulo,
    );
    const dt = constantStep(
      ms.map((m) => m.figure.rotation),
      360,
    );
    if (dr === null || dc === null || dt === null) return null;
    const last = ms.at(-1) as Mark;
    const row = wrap ? mod(last.row + dr, size) : last.row + dr;
    const col = wrap ? mod(last.col + dc, size) : last.col + dc;
    if (row < 0 || col < 0 || row >= size || col >= size) return null;
    marks.push({ figure: { ...last.figure, rotation: turn(last.figure.rotation, dt) }, row, col });
  }
  return { marks };
}

type Choice = Record<'a' | 'ar' | 'b' | 'br', number>;

function draft(random: RandomGenerator, profile: SequencePredictionProfile) {
  const { size, wrap } = profile;
  return retryGeneration('sequence frames', (): Draft<SequencePredictionChallenge> | null => {
    const ms = motions(random, profile);
    if (ms === null) return null;
    const n = profile.frames;
    const all: Frame[] = [];
    for (let i = 0; i <= n; i++) {
      const marks = ms.map((m) => markAt(m, i, size, wrap));
      if (marks.some((m) => m === null)) return null;
      const placed = marks as Mark[];
      if (placed.length === 2 && sameCell(placed[0] as Mark, placed[1] as Mark)) return null;
      all.push({ marks: placed });
    }
    // Every moving mark must change cell each frame, and wrap levels must show a wrap.
    if (
      ms.some((m) => (m.dr !== 0 || m.dc !== 0) && mod(m.dr, size) === 0 && mod(m.dc, size) === 0)
    )
      return null;
    if (wrap) {
      const wrapped = ms.some((m) =>
        Array.from({ length: n }, (_, i) => i + 1).some((i) => {
          const r = m.row + m.dr * i;
          const c = m.col + m.dc * i;
          return r < 0 || c < 0 || r >= size || c >= size;
        }),
      );
      if (!wrapped) return null;
    }
    const frames = all.slice(0, n);
    const answer = all[n] as Frame;
    const solved = solveFrames(frames, size, wrap);
    if (solved === null || frameLabel(solved, size) !== frameLabel(answer, size)) return null;

    // Options vary each mark's cell and (for arrows) its direction, from tempting misreadings:
    // standing still, stepping back, a double step, only the row or column step, swapped steps.
    const index = (r: number, c: number) => r * size + c;
    const cellAlts = (m: Motion, at: Mark) => {
      const last = all[n - 1]?.marks.find((x) => x.figure.color === m.figure.color) as Mark;
      const tries: [number, number][] = [
        [0, 0],
        [-m.dr, -m.dc],
        [m.dr, m.dc],
        [-m.dr, 0],
        [0, -m.dc],
        [m.dc - m.dr, m.dr - m.dc],
        [0, -2 * m.dc],
        [-2 * m.dr, 0],
      ];
      const out = new Set<number>();
      for (const [er, ec] of tries) {
        let r = at.row + er;
        let c = at.col + ec;
        if (wrap) {
          r = mod(r, size);
          c = mod(c, size);
        }
        if (r >= 0 && c >= 0 && r < size && c < size) out.add(index(r, c));
      }
      out.add(index(last.row, last.col));
      out.delete(index(at.row, at.col));
      return [...out];
    };
    const rotAlts = (m: Motion, at: Mark) =>
      m.turnBy === 0
        ? []
        : [
            turn(at.figure.rotation, -m.turnBy),
            turn(at.figure.rotation, 180),
            turn(at.figure.rotation, m.turnBy),
          ];
    const [ma, mb] = ms as [Motion, Motion | undefined];
    const [xa, xb] = answer.marks as [Mark, Mark | undefined];
    const target: Choice = {
      a: index(xa.row, xa.col),
      ar: xa.figure.rotation,
      b: xb ? index(xb.row, xb.col) : 0,
      br: xb?.figure.rotation ?? 0,
    };
    const alternatives = {
      ...(profile.kind === 'rotate' ? {} : { a: cellAlts(ma, xa) }),
      ar: rotAlts(ma, xa),
      ...(mb && xb ? { b: cellAlts(mb, xb), br: rotAlts(mb, xb) } : {}),
    };
    const toFrame = (o: Choice): Frame => ({
      marks: [
        {
          figure: { ...xa.figure, rotation: o.ar as Rotation },
          row: Math.floor(o.a / size),
          col: o.a % size,
        },
        ...(xb
          ? [
              {
                figure: { ...xb.figure, rotation: o.br as Rotation },
                row: Math.floor(o.b / size),
                col: o.b % size,
              },
            ]
          : []),
      ],
    });
    let options: Choice[] | null = null;
    for (let attempt = 0; attempt < 10 && options === null; attempt++) {
      const design = balancedDesign(random, target, alternatives, profile.options, (o) =>
        frameLabel(toFrame(o), size),
      );
      if (design?.every((o) => !xb || o.a !== o.b)) options = design;
    }
    if (options === null) return null;
    const [right, ...wrong] = options.map((o) => frameLabel(toFrame(o), size));

    const describe = (m: Motion) => {
      const name =
        m.figure.shape === 'arrow'
          ? `${m.figure.color} arrow`
          : `${m.figure.color} ${m.figure.shape}`;
      const moves = m.dr === 0 && m.dc === 0 ? [] : [`moves ${stepWords(m.dr, m.dc)}`];
      const turns =
        m.turnBy === 0
          ? []
          : [`turns a quarter turn ${m.turnBy > 0 ? 'clockwise' : 'anticlockwise'}`];
      return `The ${name} ${[...moves, ...turns].join(' and ')} each frame`;
    };
    return {
      prompt: wrap
        ? 'Which frame comes next? Marks leaving one edge come back on the opposite edge.'
        : 'Which frame comes next?',
      content: { kind: profile.kind, size, wrap, frames },
      response: singleChoice(random, right as string, wrong),
      explanation: `${ms.map(describe).join('. ')}${wrap ? ', wrapping around the edges' : ''}. So the next frame shows ${frameWords(answer)}.`,
      skills:
        profile.kind === 'move'
          ? ['spatial-reasoning', 'sequential-thinking']
          : ['spatial-reasoning', 'visual-orientation', 'sequential-thinking'],
    };
  });
}

export const sequencePredictionGame: GameDefinition<
  SequencePredictionChallenge,
  SequencePredictionProfile
> = {
  id: SEQUENCE_PREDICTION_ID,
  name: 'Sequence Prediction',
  tagline: 'Where will it be next?',
  description:
    'A few frames show marks moving across a grid or arrows turning, always by the same step. Work out each step and choose the frame that comes next. Higher levels combine moving and turning, wrap around the edges and track two marks at once.',
  area: 'patterns',
  skills: ['spatial-reasoning', 'sequential-thinking', 'visual-orientation'],
  meta: {
    category: 'patterns',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'Each sequence counts as correct when you choose the frame that continues it. Your result is the share of sequences predicted correctly; there is no time limit.',
    feedback: 'explain',
  },
  instructions: [
    'Watch how each mark changes from one frame to the next: how far it moves and which way an arrow turns.',
    'Every mark keeps the same step in every frame.',
    'When a level says so, a mark leaving one edge comes back on the opposite edge.',
    'Choose the next frame. Keys 1 to 8 pick an option.',
  ],
  simpleInstructions: 'See how the shape moves, then pick where it goes next.',
  levels: SEQUENCE_PREDICTION_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...draft(random, profile), timing: profile.timing };
  },
};
