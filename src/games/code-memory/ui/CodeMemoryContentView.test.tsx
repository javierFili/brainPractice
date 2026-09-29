import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import type { DifficultyLevel } from '@/domain/shared';
import type { ChallengePhase, LocateBinding } from '@/games/types';
import { codeMemoryGame } from '../content/definition';
import { formatAssignment } from '../content/format';
import type { Assignment, MemoryChallenge, MemoryKind } from '../content/types';
import { CodeMemoryContentView } from './CodeMemoryContentView';

type Of<K extends MemoryKind> = MemoryChallenge & {
  content: Extract<MemoryChallenge['content'], { kind: K }>;
};

function challengeOf<K extends MemoryKind>(kind: K, level: DifficultyLevel): Of<K> {
  for (let seed = 1; seed < 500; seed++) {
    const challenge = generateChallenge(codeMemoryGame, { level, seed });
    if (challenge.content.kind === kind) return challenge as Of<K>;
  }
  throw new Error(`No ${kind} challenge at level ${level}`);
}

const binding = (overrides: Partial<LocateBinding> = {}): LocateBinding => ({
  disabled: false,
  selectedIndex: null,
  solutionIndex: null,
  onLocate: vi.fn(),
  ...overrides,
});

const show = (challenge: MemoryChallenge, phase: ChallengePhase, locate: LocateBinding | null) =>
  render(<CodeMemoryContentView challenge={challenge} phase={phase} locate={locate} />);

const HIDDEN = /Hidden — answer from memory/;

describe('CodeMemoryContentView — hidden material', () => {
  it('record-recall: shows records in study, hides them to answer, reveals the asked one in review', () => {
    const challenge = challengeOf('record-recall', 3);
    const record = challenge.content.records[challenge.content.ask.recordIndex];
    const { unmount } = show(challenge, 'study', null);
    const records = screen.getByRole('list', { name: 'Records' });
    expect(within(records).getByText(record?.type ?? '')).toBeInTheDocument();
    expect(screen.queryByText('← asked')).not.toBeInTheDocument();
    unmount();

    const respond = show(challenge, 'respond', null);
    expect(screen.queryByRole('list', { name: 'Records' })).not.toBeInTheDocument();
    expect(screen.getByText(HIDDEN)).toBeInTheDocument();
    respond.unmount();

    show(challenge, 'review', null);
    expect(screen.getByRole('list', { name: 'Records' })).toBeInTheDocument();
    expect(screen.getByText('← asked')).toBeInTheDocument();
  });

  it('variable-state: hides the assignments while answering and marks the asked line in review', () => {
    const challenge = challengeOf('variable-state', 5);
    const firstLine = formatAssignment(challenge.content.lines[0] as Assignment);
    const { unmount } = show(challenge, 'study', null);
    expect(screen.getByRole('list', { name: 'Assignments' })).toHaveTextContent(firstLine);
    unmount();

    const respond = show(challenge, 'respond', null);
    expect(screen.queryByRole('list', { name: 'Assignments' })).not.toBeInTheDocument();
    expect(screen.getByText(HIDDEN)).toBeInTheDocument();
    respond.unmount();

    show(challenge, 'review', null);
    expect(screen.getByRole('list', { name: 'Assignments' })).toHaveTextContent(firstLine);
    expect(screen.getByText('← asked here')).toBeInTheDocument();
  });

  it('sequence-recall: numbers the calls in study and marks the answer in review', () => {
    const challenge = challengeOf('sequence-recall', 1);
    const { unmount } = show(challenge, 'study', null);
    const calls = screen.getByRole('list', { name: 'Calls' });
    expect(within(calls).getAllByRole('listitem')).toHaveLength(challenge.content.calls.length);
    expect(screen.queryByText('✓ answer')).not.toBeInTheDocument();
    unmount();

    const respond = show(challenge, 'respond', null);
    expect(screen.queryByRole('list', { name: 'Calls' })).not.toBeInTheDocument();
    respond.unmount();

    show(challenge, 'review', null);
    const answer = screen.getByText('✓ answer').closest('li');
    const { ask, calls: all } = challenge.content;
    const index =
      ask.type === 'successor' ? ask.index + 1 : ask.type === 'position' ? ask.index : -1;
    expect(answer).toHaveTextContent(all[index] ?? '');
  });

  it('cross-reference and joins: tables in study, hidden while answering, answer cell marked in review', () => {
    for (const challenge of [
      challengeOf('cross-reference', 7),
      challengeOf('foreign-key-join', 9),
    ]) {
      const { unmount } = show(challenge, 'study', null);
      expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
      expect(screen.queryByText('(answer)')).not.toBeInTheDocument();
      unmount();

      const respond = show(challenge, 'respond', null);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.getByText(HIDDEN)).toBeInTheDocument();
      respond.unmount();

      const review = show(challenge, 'review', null);
      expect(screen.getByText('(answer)')).toBeInTheDocument();
      review.unmount();
    }
  });
});

describe('CodeMemoryContentView — position recall', () => {
  const challenge = challengeOf('position-recall', 4);
  const { rows, cols, cells, target } = challenge.content;
  const answer = cells.indexOf(target);
  const cellName = (index: number) =>
    `Row ${Math.floor(index / cols) + 1}, column ${(index % cols) + 1}`;

  it('shows the keywords during study, without clickable cells', () => {
    show(challenge, 'study', binding({ disabled: true }));
    expect(screen.getByText(target)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows an empty grid of position-named cells and reports the clicked cell', async () => {
    const user = userEvent.setup();
    const onLocate = vi.fn();
    const locate = binding({ onLocate });
    show(challenge, 'respond', locate);
    expect(screen.queryByText(target)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(rows * cols);
    await user.click(screen.getByRole('button', { name: cellName(answer) }));
    expect(onLocate).toHaveBeenCalledWith(answer);
  });

  it('can be answered with the keyboard', async () => {
    const user = userEvent.setup();
    const onLocate = vi.fn();
    const locate = binding({ onLocate });
    show(challenge, 'respond', locate);
    screen.getByRole('button', { name: cellName(0) }).focus();
    await user.keyboard('{Enter}');
    expect(onLocate).toHaveBeenCalledWith(0);
  });

  it('ignores clicks when the binding is disabled', async () => {
    const user = userEvent.setup();
    const onLocate = vi.fn();
    const locate = binding({ disabled: true, onLocate });
    show(challenge, 'respond', locate);
    const cell = screen.getByRole('button', { name: cellName(answer) });
    expect(cell).toBeDisabled();
    await user.click(cell);
    expect(onLocate).not.toHaveBeenCalled();
  });

  it('reveals the grid in review with the answer and a wrong pick labelled in text', () => {
    const wrong = answer === 0 ? 1 : 0;
    show(
      challenge,
      'review',
      binding({ disabled: true, selectedIndex: wrong, solutionIndex: answer }),
    );
    expect(screen.getByText('✓ answer').parentElement).toHaveTextContent(target);
    expect(screen.getByText('✗ your pick')).toBeInTheDocument();
  });
});
