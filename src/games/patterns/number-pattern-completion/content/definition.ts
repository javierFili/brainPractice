import { numericResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import type { Draft } from '../../shared/content';
import { NUMBER_PATTERN_LEVELS } from './levels';
import {
  crossCentre,
  crossPredictions,
  gridPredictions,
  solvePyramid,
  wheelPredictions,
} from './rules';
import type {
  CrossRuleName,
  GridRuleName,
  NumberCross,
  NumberPatternChallenge,
  NumberPatternKind,
  NumberPatternProfile,
  WheelRuleName,
} from './types';

export const NUMBER_PATTERN_ID = gameIdOf('number-pattern-completion');

type NumberDraft = Draft<NumberPatternChallenge>;
type Line = [number, number, number];

const transpose = (g: number[][]) => g.map((_, r) => g.map((row) => row[r] as number));

const GRID_TEXT: Record<GridRuleName, string> = {
  'row-sum': 'In each row, the first number plus the second gives the third.',
  'column-sum': 'In each column, the top number plus the middle one gives the bottom one.',
  'row-difference': 'In each row, the first number minus the second gives the third.',
  'column-difference': 'In each column, the top number minus the middle one gives the bottom one.',
  'row-step': 'Each row goes up or down by its own fixed step from left to right.',
  'column-step': 'Each column goes up or down by its own fixed step from top to bottom.',
  'row-product': 'In each row, the first number times the second gives the third.',
  'column-product': 'In each column, the top number times the middle one gives the bottom one.',
  'add-table':
    'Moving from one column to another adds the same amount in every row (and moving between rows adds the same amount in every column).',
  'row-total': 'Every row adds up to the same total.',
  'column-total': 'Every column adds up to the same total.',
};

/** Builds one line (three numbers, left to right or top to bottom) for a line rule. */
function line(random: RandomGenerator, rule: GridRuleName, max: number): Line {
  const base = rule.replace('column-', 'row-');
  switch (base) {
    case 'row-sum': {
      const a = randomInt(random, 1, max);
      const b = randomInt(random, 1, max);
      return [a, b, a + b];
    }
    case 'row-difference': {
      const b = randomInt(random, 1, max);
      const c = randomInt(random, 1, max);
      return [b + c, b, c];
    }
    case 'row-step': {
      const step = pick(random, [-4, -3, -2, -1, 1, 2, 3, 4, 5]);
      const start =
        step > 0 ? randomInt(random, 1, max) : randomInt(random, 1 - 2 * step, max - 2 * step);
      return [start, start + step, start + 2 * step];
    }
    default: {
      const a = randomInt(random, 2, Math.min(max, 9));
      const b = randomInt(random, 2, Math.min(max, 9));
      return [a, b, a * b];
    }
  }
}

function fullGrid(random: RandomGenerator, rule: GridRuleName, max: number): number[][] {
  if (rule === 'add-table') {
    const rows = sample(
      random,
      Array.from({ length: max }, (_, i) => i),
      3,
    );
    const cols = sample(
      random,
      Array.from({ length: max }, (_, i) => i + 1),
      3,
    );
    return rows.map((a) => cols.map((b) => a + b));
  }
  if (rule === 'row-total' || rule === 'column-total') {
    const total = randomInt(random, max + 3, 2 * max + 3);
    const rows = Array.from({ length: 3 }, () => {
      const x = randomInt(random, 1, total - 2);
      const y = randomInt(random, 1, total - x - 1);
      return sample(random, [x, y, total - x - y], 3);
    });
    return rule === 'row-total' ? rows : transpose(rows);
  }
  const rows = Array.from({ length: 3 }, () => line(random, rule, max));
  return rule.startsWith('column-') ? transpose(rows) : rows;
}

function gridDraft(random: RandomGenerator, profile: NumberPatternProfile): NumberDraft | null {
  const rule = pick(random, profile.grid.rules);
  const full = fullGrid(random, rule, profile.maxValue);
  const lineRule = !['add-table', 'row-total', 'column-total'].includes(rule);
  const columnRule = rule.startsWith('column-');
  let r = randomInt(random, 0, 2);
  let c = randomInt(random, 0, 2);
  if (!profile.grid.missingAnywhere && lineRule) {
    if (columnRule) r = 2;
    else c = 2;
  }
  const answer = (full[r] as number[])[c] as number;
  if (answer < 0 || new Set(full.map((row) => row.join())).size < 3) return null;
  const cells = full.map((row, i) => row.map((v, j) => (i === r && j === c ? null : v)));
  const predicted = gridPredictions(cells);
  if (predicted.size !== 1 || !predicted.has(answer)) return null;
  const lineValues = columnRule ? full.map((row) => row[c] as number) : (full[r] as number[]);
  const shown = lineValues.map((v, i) => ((columnRule ? i === r : i === c) ? `?` : String(v)));
  const where = columnRule ? `column ${c + 1}` : `row ${r + 1}`;
  const working =
    rule === 'add-table'
      ? `so the missing number is ${answer}`
      : rule === 'row-total' || rule === 'column-total'
        ? `the total is ${lineValues.reduce((a, b) => a + b, 0)}, so in ${rule === 'row-total' ? `row ${r + 1}` : `column ${c + 1}`} the missing number is ${answer}`
        : `in ${where} (${shown.join(', ')}) the missing number is ${answer}`;
  return {
    prompt: 'Find the rule in the rows or columns. Which number is missing?',
    content: { kind: 'grid', cells },
    response: numericResponse(answer),
    explanation: `${GRID_TEXT[rule]} Here ${working}.`,
    skills: ['pattern-recognition', 'logical-reasoning'],
  };
}

function pyramidDraft(random: RandomGenerator, profile: NumberPatternProfile): NumberDraft | null {
  const { base, askBottom, blanks } = profile.pyramid;
  const bottomMax = base >= 5 ? 6 : base === 4 ? Math.min(profile.maxValue, 10) : profile.maxValue;
  const rows: number[][] = [Array.from({ length: base }, () => randomInt(random, 1, bottomMax))];
  while ((rows[0] as number[]).length > 1) {
    const below = rows[0] as number[];
    rows.unshift(below.slice(1).map((v, i) => (below[i] as number) + v));
  }
  const positions = rows.flatMap((row, r) => row.map((_, i) => [r, i] as const));
  const askable = positions.filter(([r]) => askBottom || r < base - 1);
  const ask = pick(random, askable);
  const others = sample(
    random,
    positions.filter(([r, i]) => r !== ask[0] || i !== ask[1]),
    blanks,
  );
  const hidden = new Set([ask, ...others].map(([r, i]) => `${r}:${i}`));
  const shown = rows.map((row, r) => row.map((v, i) => (hidden.has(`${r}:${i}`) ? null : v)));
  const solved = solvePyramid(shown);
  const answer = (rows[ask[0]] as number[])[ask[1]] as number;
  if (solved.rows[ask[0]]?.[ask[1]] !== answer) return null;
  // Show only the deductions up to the "?" itself.
  const last = solved.steps.findIndex((s) => s.at[0] === ask[0] && s.at[1] === ask[1]);
  const steps = solved.steps.slice(0, last + 1).map((s) => s.text);
  return {
    prompt:
      'Each brick is the sum of the two bricks below it. What number goes in the brick marked “?”',
    content: { kind: 'pyramid', rows: shown, ask },
    response: numericResponse(answer),
    explanation: `Each brick is the sum of the two below it. Working it out: ${steps.join('; ')}. So “?” is ${answer}.`,
    skills: ['logical-reasoning', 'problem-solving'],
  };
}

function wheelDraft(random: RandomGenerator, profile: NumberPatternProfile): NumberDraft | null {
  const rule: WheelRuleName = pick(random, profile.wheel.rules);
  const n = profile.wheel.segments;
  const half = n / 2;
  const max = profile.maxValue;
  const k =
    rule === 'opposite-sum' ? randomInt(random, max + 2, 2 * max) : randomInt(random, 1, max);
  const first = Array.from({ length: half }, () =>
    rule === 'opposite-sum' ? randomInt(random, 1, k - 1) : randomInt(random, k + 1, k + max),
  );
  const full = [...first, ...first.map((a) => (rule === 'opposite-sum' ? k - a : a - k))];
  const missing = randomInt(random, 0, n - 1);
  const answer = full[missing] as number;
  const segments = full.map((v, i) => (i === missing ? null : v));
  const predicted = wheelPredictions(segments);
  if (predicted.size !== 1 || !predicted.has(answer)) return null;
  const partner = full[(missing + half) % n] as number;
  const text =
    rule === 'opposite-sum'
      ? `Opposite segments always add up to ${k}. The segment opposite the gap is ${partner}, so the missing number is ${k} − ${partner} = ${answer}.`
      : `Each of the first ${half} segments (clockwise from the top) is ${k} more than the segment opposite it. The segment opposite the gap is ${partner}, so the missing number is ${missing < half ? `${partner} + ${k}` : `${partner} − ${k}`} = ${answer}.`;
  return {
    prompt: 'Find how opposite numbers on the wheel are linked. Which number is missing?',
    content: { kind: 'wheel', segments },
    response: numericResponse(answer),
    explanation: text,
    skills: ['pattern-recognition', 'spatial-reasoning'],
  };
}

const CROSS_TEXT: Record<CrossRuleName, string> = {
  sum: 'The centre is the sum of the four arms',
  'vertical-minus-horizontal': 'The centre is (top + bottom) − (left + right)',
  'product-sum': 'The centre is top × bottom + left × right',
  'product-difference': 'The centre is top × bottom − left × right',
};

const crossWorking = (rule: CrossRuleName, c: NumberCross) => {
  const { top, bottom, left, right } = c;
  switch (rule) {
    case 'sum':
      return `${top} + ${right} + ${bottom} + ${left}`;
    case 'vertical-minus-horizontal':
      return `(${top} + ${bottom}) − (${left} + ${right})`;
    case 'product-sum':
      return `${top} × ${bottom} + ${left} × ${right}`;
    case 'product-difference':
      return `${top} × ${bottom} − ${left} × ${right}`;
  }
};

function crossDraft(random: RandomGenerator, profile: NumberPatternProfile): NumberDraft | null {
  const rule = pick(random, profile.cross.rules);
  const product = rule.startsWith('product');
  const max = product ? 6 : Math.min(profile.maxValue, 12);
  const crosses = Array.from({ length: 3 }, (): NumberCross => {
    const arms = {
      top: randomInt(random, 1, max),
      right: randomInt(random, 1, max),
      bottom: randomInt(random, 1, max),
      left: randomInt(random, 1, max),
    };
    return { ...arms, centre: crossCentre(rule, { ...arms, centre: null }) };
  });
  if (crosses.some((c) => (c.centre ?? 0) <= 0)) return null;
  const last = crosses[2] as NumberCross;
  const answer = last.centre as number;
  const shown = [crosses[0] as NumberCross, crosses[1] as NumberCross, { ...last, centre: null }];
  const predicted = crossPredictions(shown);
  if (predicted.size !== 1 || !predicted.has(answer)) return null;
  return {
    prompt:
      'The centre of each cross comes from its four arms in the same way. What is the missing centre?',
    content: { kind: 'cross', crosses: shown },
    response: numericResponse(answer),
    explanation: `${CROSS_TEXT[rule]}. In the last cross: ${crossWorking(rule, last)} = ${answer}.`,
    skills: ['abstraction', 'logical-reasoning'],
  };
}

const GENERATORS: Record<
  NumberPatternKind,
  (random: RandomGenerator, profile: NumberPatternProfile) => NumberDraft | null
> = { grid: gridDraft, pyramid: pyramidDraft, wheel: wheelDraft, cross: crossDraft };

export const numberPatternGame: GameDefinition<NumberPatternChallenge, NumberPatternProfile> = {
  id: NUMBER_PATTERN_ID,
  name: 'Number Pattern Completion',
  tagline: 'Find the missing number in grids, pyramids, wheels and crosses.',
  description:
    'Numbers are laid out in grids, pyramids, wheels and crosses, and each layout follows a rule: rows that add up, bricks that sum the two below, opposite segments that match, centres made from their arms. Find the rule and type the missing number.',
  area: 'patterns',
  skills: ['pattern-recognition', 'logical-reasoning', 'problem-solving', 'abstraction'],
  meta: {
    category: 'patterns',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'numeric',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'Each layout counts as correct when you type the exact missing number. Your result is the share of layouts completed correctly; there is no time limit.',
    feedback: 'explain',
  },
  instructions: [
    'Each layout hides one number, marked “?”. Find the rule the other numbers follow.',
    'Grids: compare rows and columns. Pyramids: each brick is the sum of the two below it.',
    'Wheels: look at numbers on opposite sides. Crosses: the centre comes from the four arms, the same way in every cross.',
    'Type the missing number and press Enter.',
  ],
  simpleInstructions: 'Find the rule and type the missing number.',
  levels: NUMBER_PATTERN_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    const draft = retryGeneration(`number pattern (${kind})`, () =>
      GENERATORS[kind](random, profile),
    );
    return { ...identity, ...draft, timing: profile.timing };
  },
};
