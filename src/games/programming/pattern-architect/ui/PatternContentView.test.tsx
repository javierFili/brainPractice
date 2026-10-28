import { render, screen, within } from '@testing-library/react';
import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { patternArchitectGame } from '../content/definition';
import { cellLabel, describeCell } from '../content/format';
import { formatList } from '../content/solvers/listOps';
import { formatTree } from '../content/solvers/treeOps';
import type { PatternChallenge, PatternContent, PatternKind } from '../content/types';
import { PatternContentView } from './PatternContentView';

type Of<K extends PatternKind> = PatternChallenge & {
  content: Extract<PatternContent, { kind: K }>;
};

/** First generated challenge of a kind (levels low to high, so the earliest variant is used). */
function challengeOf<K extends PatternKind>(kind: K): Of<K> {
  for (const level of DIFFICULTY_LEVELS)
    for (let seed = 1; seed < 60; seed++) {
      const challenge = generateChallenge(patternArchitectGame, { level, seed });
      if (challenge.content.kind === kind) return challenge as Of<K>;
    }
  throw new Error(`No ${kind} challenge found`);
}

const show = (challenge: PatternChallenge) =>
  render(
    <PatternContentView
      challenge={challenge}
      phase="respond"
      locate={null}
      respond={null}
      answer={null}
      assisted={false}
    />,
  );

describe('PatternContentView', () => {
  it('number-sequence: shows every term and an unknown next term', () => {
    const challenge = challengeOf('number-sequence');
    show(challenge);
    const sequence = screen.getByRole('list', { name: 'Sequence' });
    const items = within(sequence).getAllByRole('listitem');
    expect(items).toHaveLength(challenge.content.terms.length + 1);
    challenge.content.terms.forEach((term, i) => {
      expect(items[i]).toHaveTextContent(String(term));
    });
    expect(within(sequence).getByText('Next term (unknown)')).toBeInTheDocument();
  });

  it('symbol-grid: renders a real table with described cells and a labelled missing cell', () => {
    const challenge = challengeOf('symbol-grid');
    show(challenge);
    const table = screen.getByRole('table', { name: /Symbol grid/ });
    const cells = within(table).getAllByRole('cell');
    const expected = challenge.content.cells.flat();
    expect(cells).toHaveLength(expected.length);
    expected.forEach((cell, i) => {
      const td = cells[i] as HTMLElement;
      if (cell === null) expect(td).toHaveTextContent('Missing cell');
      else {
        expect(td).toHaveTextContent(cellLabel(cell));
        expect(within(td).getByText(describeCell(cell))).toBeInTheDocument();
      }
    });
    expect(within(table).getAllByText('Missing cell')).toHaveLength(1);
  });

  it('transform-inference: lists every example, the new input and the step vocabulary', () => {
    const challenge = challengeOf('transform-inference');
    show(challenge);
    const table = screen.getByRole('table', { name: /Examples/ });
    for (const { input, output } of challenge.content.examples) {
      const row = within(table).getByRole('row', { name: new RegExp(escape(formatList(input))) });
      expect(row).toHaveTextContent(formatList(output));
    }
    expect(within(table).getByText(formatList(challenge.content.question))).toBeInTheDocument();
    expect(within(table).getByText('Output for the new input (unknown)')).toBeInTheDocument();
    expect(screen.getByText('Possible steps')).toBeInTheDocument();
    expect(screen.getByText('reverse the list')).toBeInTheDocument();
  });

  it('structure-match: shows the reference and every candidate as labelled arrow lists', () => {
    const challenge = challengeOf('structure-match');
    show(challenge);
    const reference = screen.getByRole('list', { name: 'Arrows of the reference' });
    expect(within(reference).getAllByRole('listitem')).toHaveLength(
      challenge.content.reference.nodes.length,
    );
    for (const { name, graph } of challenge.content.candidates) {
      const list = screen.getByRole('list', { name: `Arrows of Graph ${name}` });
      const [from, to] = graph.edges[0] as readonly [string, string];
      const line = within(list)
        .getAllByRole('listitem')
        .find((item) => item.textContent.startsWith(from)) as HTMLElement;
      expect(line).toHaveTextContent(to);
    }
  });

  it('tree-analogy: draws each example pair and the new tree with its notation', () => {
    const challenge = challengeOf('tree-analogy');
    show(challenge);
    challenge.content.examples.forEach(({ before, after }, i) => {
      expect(screen.getByRole('list', { name: `Example ${i + 1}, before` })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: `Example ${i + 1}, after` })).toBeInTheDocument();
      expect(screen.getByText(formatTree(before))).toBeInTheDocument();
      expect(screen.getByText(formatTree(after))).toBeInTheDocument();
    });
    const tree = screen.getByRole('list', { name: 'New tree' });
    expect(tree).toHaveTextContent(challenge.content.question.label);
    expect(screen.getByText(formatTree(challenge.content.question))).toBeInTheDocument();
    expect(screen.getByText('Restructured new tree (unknown)')).toBeInTheDocument();
  });
});

function escape(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
