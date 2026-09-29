import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import type { DifficultyLevel } from '@/domain/shared';
import { logicGame } from '../content/definition';
import type { Expr, LogicChallenge, LogicKind } from '../content/types';
import { formatCond, formatExpr, toLines } from './formatPseudocode';
import { LogicContentView } from './LogicContentView';

function findChallenge(kind: LogicKind, level: DifficultyLevel): LogicChallenge {
  for (let seed = 0; seed < 300; seed++) {
    const challenge = generateChallenge(logicGame, { level, seed });
    if (challenge.content.kind === kind) return challenge;
  }
  throw new Error(`No ${kind} at level ${level}`);
}

const view = (challenge: LogicChallenge) =>
  render(<LogicContentView challenge={challenge} phase="respond" locate={null} />);

describe('pseudocode formatting', () => {
  const v = (name: string): Expr => ({ type: 'var', name });
  it('adds parentheses only where precedence requires them', () => {
    const sum: Expr = { type: 'bin', op: '+', left: v('a'), right: v('b') };
    expect(formatExpr({ type: 'bin', op: '*', left: sum, right: v('c') })).toBe('(a + b) * c');
    expect(
      formatExpr({
        type: 'bin',
        op: '+',
        left: v('a'),
        right: { type: 'bin', op: '*', left: v('b'), right: v('c') },
      }),
    ).toBe('a + b * c');
    expect(formatExpr({ type: 'bin', op: '-', left: v('a'), right: sum })).toBe('a - (a + b)');
  });

  it('formats boolean conditions and nested blocks with indentation', () => {
    const cmp = { type: 'cmp', op: '<', left: v('a'), right: { type: 'num', value: 3 } } as const;
    expect(formatCond({ type: 'not', operand: { type: 'and', left: cmp, right: cmp } })).toBe(
      'not (a < 3 and a < 3)',
    );
    const lines = toLines([
      {
        type: 'repeat',
        times: 2,
        body: [{ type: 'if', cond: cmp, then: [{ type: 'swap', a: 'a', b: 'b' }], otherwise: [] }],
      },
    ]);
    expect(lines.map((l) => [l.depth, l.keyword])).toEqual([
      [0, 'repeat'],
      [1, 'if'],
      [2, 'swap'],
    ]);
  });
});

describe('LogicContentView', () => {
  it('renders a program as numbered pseudocode', () => {
    const challenge = findChallenge('program-trace', 6);
    view(challenge);
    const code = screen.getByLabelText('Pseudocode program');
    expect(code.textContent).toContain('set');
    expect(code.textContent).toMatch(/repeat|if/);
  });

  it('lists every module and dependency, also grouped by module', async () => {
    const user = userEvent.setup();
    const challenge = findChallenge('dependency-order', 5);
    if (challenge.content.kind !== 'dependency-order') throw new Error('unexpected kind');
    view(challenge);
    expect(
      within(screen.getByRole('list', { name: 'Modules' })).getAllByRole('listitem'),
    ).toHaveLength(challenge.content.graph.nodes.length);
    expect(
      within(screen.getByRole('list', { name: 'Dependencies' })).getAllByRole('listitem'),
    ).toHaveLength(challenge.content.graph.edges.length);
    await user.click(screen.getByText('Same dependencies, grouped by module'));
    expect(screen.getAllByText(/needs |no prerequisites/).length).toBe(
      challenge.content.graph.nodes.length,
    );
  });

  it('shows durations for weighted scheduling and the rules of constraint puzzles', () => {
    const scheduling = findChallenge('critical-path', 10);
    const { unmount } = view(scheduling);
    expect(screen.getAllByText(/rounds?\)/).length).toBeGreaterThan(0);
    unmount();
    const puzzle = findChallenge('constraint-arrangement', 7);
    if (puzzle.content.kind !== 'constraint-arrangement') throw new Error('unexpected kind');
    view(puzzle);
    expect(screen.getAllByText(/deployed/)).toHaveLength(puzzle.content.rules.length);
  });
});
