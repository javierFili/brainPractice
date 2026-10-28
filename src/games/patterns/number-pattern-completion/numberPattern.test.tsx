import { render, screen } from '@testing-library/react';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { expectFastGeneration, generateMany } from '../shared/testing';
import { numberPatternGame } from './content/definition';
import { NUMBER_PATTERN_LEVELS } from './content/levels';
import type { NumberCross, NumberPatternChallenge } from './content/types';
import { numberPatternModule } from './index';
import { NumberPatternView } from './ui/NumberPatternView';

describeGameContract(numberPatternModule);

// ── Independent oracle: substitute every candidate and test whole-layout rules ────────────────────

type Grid = number[][];
const n = <T,>(x: T | undefined | null): T => {
  if (x === undefined || x === null) throw new Error('missing value');
  return x;
};
const rows = (g: Grid) => g;
const cols = (g: Grid) => g.map((_, c) => g.map((row) => row[c] as number));
const every = (lines: Grid, ok: (l: number[]) => boolean) => lines.every(ok);
const sameTotals = (lines: Grid) =>
  new Set(lines.map((l) => n(l[0]) + n(l[1]) + n(l[2]))).size === 1;

const GRID_CHECKS: ((g: Grid) => boolean)[] = [
  (g) => every(rows(g), ([a, b, c]) => n(a) + n(b) === c),
  (g) => every(cols(g), ([a, b, c]) => n(a) + n(b) === c),
  (g) => every(rows(g), ([a, b, c]) => n(a) - n(b) === c),
  (g) => every(cols(g), ([a, b, c]) => n(a) - n(b) === c),
  (g) => every(rows(g), ([a, b, c]) => n(b) - n(a) === n(c) - n(b)),
  (g) => every(cols(g), ([a, b, c]) => n(b) - n(a) === n(c) - n(b)),
  (g) => every(rows(g), ([a, b, c]) => n(a) * n(b) === c),
  (g) => every(cols(g), ([a, b, c]) => n(a) * n(b) === c),
  // Additive table: every row differs from the first by a constant.
  (g) => g.every((row) => new Set(row.map((v, c) => v - n(n(g[0])[c]))).size === 1),
  (g) => sameTotals(rows(g)),
  (g) => sameTotals(cols(g)),
];

const WHEEL_CHECKS: ((s: number[]) => boolean)[] = [
  (s) => new Set(s.slice(0, s.length / 2).map((v, i) => v + n(s[i + s.length / 2]))).size === 1,
  (s) => new Set(s.slice(0, s.length / 2).map((v, i) => v - n(s[i + s.length / 2]))).size === 1,
  (s) => new Set(s.slice(1).map((v, i) => v - n(s[i]))).size === 1,
];

const CROSS_CHECKS: ((c: Required<{ [K in keyof NumberCross]: number }>) => boolean)[] = [
  (c) => c.centre === c.top + c.right + c.bottom + c.left,
  (c) => c.centre === c.top + c.bottom - c.left - c.right,
  (c) => c.centre === c.top * c.bottom + c.left * c.right,
  (c) => c.centre === c.top * c.bottom - c.left * c.right,
];

const CANDIDATES = Array.from({ length: 701 }, (_, i) => i - 200);

function fitting(challenge: NumberPatternChallenge): number[] {
  const { content } = challenge;
  switch (content.kind) {
    case 'grid':
      return CANDIDATES.filter((v) => {
        const g = content.cells.map((row) => row.map((x) => x ?? v));
        return GRID_CHECKS.some((check) => check(g));
      });
    case 'wheel':
      return CANDIDATES.filter((v) => {
        const s = content.segments.map((x) => x ?? v);
        return WHEEL_CHECKS.some((check) => check(s));
      });
    case 'cross':
      return CANDIDATES.filter((v) => {
        const all = content.crosses.map((c) => ({ ...c, centre: c.centre ?? v }));
        return CROSS_CHECKS.some((check) => all.every(check));
      });
    case 'pyramid':
      return [];
  }
}

const binomial = (n: number, k: number): number =>
  k === 0 || k === n ? 1 : binomial(n - 1, k - 1) + binomial(n - 1, k);

const rank = (matrix: number[][]) => {
  const m = matrix.map((row) => [...row]);
  let r = 0;
  const width = m[0]?.length ?? 0;
  for (let c = 0; c < width && r < m.length; c++) {
    const p = m.findIndex((row, i) => i >= r && Math.abs(n(row[c])) > 1e-9);
    if (p === -1) continue;
    [m[r], m[p]] = [n(m[p]), n(m[r])];
    for (let i = 0; i < m.length; i++)
      if (i !== r) {
        const f = n(n(m[i])[c]) / n(n(m[r])[c]);
        m[i] = n(m[i]).map((x, j) => x - f * n(n(m[r])[j]));
      }
    r++;
  }
  return r;
};

/** Every brick is a weighted sum of the bottom row; the "?" is fixed iff its weights are spanned. */
function pyramidDetermined(challenge: NumberPatternChallenge) {
  const { content } = challenge;
  if (content.kind !== 'pyramid') throw new Error('pyramid expected');
  const base = content.rows.length;
  const bottom = n(content.rows[base - 1]);
  const unknown = bottom.flatMap((v, i) => (v === null ? [i] : []));
  const weights = (r: number, i: number) => {
    const depth = base - 1 - r;
    return unknown.map((u) => (u >= i && u <= i + depth ? binomial(depth, u - i) : 0));
  };
  if (unknown.length === 0) return true;
  const equations = content.rows.flatMap((row, r) =>
    row.flatMap((v, i) => (v === null ? [] : [weights(r, i)])),
  );
  const target = weights(content.ask[0], content.ask[1]);
  return (
    rank([...equations, target]) === rank(equations.length > 0 ? equations : [unknown.map(() => 0)])
  );
}

describe('Number Pattern Completion', () => {
  const all = generateMany(numberPatternGame, 40);

  it('has exactly one number that fits each layout, at every level', () => {
    for (const { challenge } of all) {
      if (challenge.response.format !== 'numeric') throw new Error('numeric expected');
      const answer = challenge.response.solution.value;
      if (challenge.content.kind === 'pyramid') {
        expect(pyramidDetermined(challenge)).toBe(true);
        continue;
      }
      expect(fitting(challenge)).toEqual([answer]);
    }
  });

  it('keeps pyramids true to the rule', () => {
    for (const { challenge } of all) {
      const { content } = challenge;
      if (content.kind !== 'pyramid') continue;
      content.rows.forEach((row, r) => {
        row.forEach((v, i) => {
          const a = content.rows[r + 1]?.[i];
          const b = content.rows[r + 1]?.[i + 1];
          if (v !== null && a != null && b != null) expect(v).toBe(a + b);
        });
      });
    }
  });

  it('uses every layout across the levels', () => {
    expect(new Set(all.map(({ challenge }) => challenge.content.kind))).toEqual(
      new Set(['grid', 'pyramid', 'wheel', 'cross']),
    );
  });

  it('raises the load across levels', () => {
    expectNonDecreasing(NUMBER_PATTERN_LEVELS, (p) => p.maxValue, 'max value');
    expectNonDecreasing(NUMBER_PATTERN_LEVELS, (p) => p.pyramid.base, 'pyramid base');
    expectNonDecreasing(NUMBER_PATTERN_LEVELS, (p) => p.pyramid.blanks, 'pyramid blanks');
    expectNonDecreasing(NUMBER_PATTERN_LEVELS, (p) => p.timing.targetMs, 'target time');
  });

  it('describes wheels and crosses in words', () => {
    const wheel = n(all.find(({ challenge }) => challenge.content.kind === 'wheel')).challenge;
    render(
      <NumberPatternView
        challenge={wheel}
        phase="respond"
        locate={null}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    expect(screen.getByText(/clockwise from the top/)).toBeInTheDocument();
  });

  it('generates quickly', () => {
    expectFastGeneration(numberPatternGame);
  });
});
