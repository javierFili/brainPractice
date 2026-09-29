import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import type { DifficultyLevel } from '@/domain/shared';
import type { LocateBinding } from '@/games/types';
import { codeScanGame } from '../content/definition';
import type { CodeScanKind, SpeedChallenge } from '../content/types';
import { CodeScanContentView } from './CodeScanContentView';

function challengeOf(
  kind: CodeScanKind,
  level: DifficultyLevel,
  identical?: boolean,
): SpeedChallenge {
  for (let seed = 1; seed < 500; seed++) {
    const c = generateChallenge(codeScanGame, { level, seed });
    const same = JSON.stringify(c.content.original) === JSON.stringify(c.content.copy);
    if (c.content.kind === kind && (identical === undefined || identical === same)) return c;
  }
  throw new Error(`No ${kind} challenge found`);
}

const binding = (overrides: Partial<LocateBinding> = {}): LocateBinding => ({
  disabled: false,
  selectedIndex: null,
  solutionIndex: null,
  onLocate: () => undefined,
  ...overrides,
});

const solutionIndex = (c: SpeedChallenge) => (c.response.solution as { index: number }).index;
const copyColumn = () => screen.getByRole('region', { name: 'Copy snippet' });

describe('CodeScanContentView', () => {
  const find = challengeOf('find-the-change', 4);

  it('shows both snippets with every copy line as a labelled button', () => {
    render(<CodeScanContentView challenge={find} phase="respond" locate={binding()} />);
    expect(screen.getByRole('region', { name: 'Original snippet' })).toBeInTheDocument();
    const lines = within(copyColumn()).getAllByRole('button');
    expect(lines).toHaveLength(find.content.copy.length);
    expect(lines[0]).toHaveAccessibleName(/^Line 1: /);
  });

  it('reports the clicked copy line, also from the keyboard', async () => {
    const user = userEvent.setup();
    const onLocate = vi.fn();
    render(<CodeScanContentView challenge={find} phase="respond" locate={binding({ onLocate })} />);
    await user.click(screen.getByRole('button', { name: /^Line 3: / }));
    expect(onLocate).toHaveBeenCalledWith(2);
    screen.getByRole('button', { name: /^Line 1: / }).focus();
    await user.keyboard('{Enter}');
    expect(onLocate).toHaveBeenLastCalledWith(0);
  });

  it('ignores clicks while the binding is disabled', async () => {
    const user = userEvent.setup();
    const onLocate = vi.fn();
    render(
      <CodeScanContentView
        challenge={find}
        phase="respond"
        locate={binding({ disabled: true, onLocate })}
      />,
    );
    const line = screen.getByRole('button', { name: /^Line 2: / });
    expect(line).toBeDisabled();
    await user.click(line);
    expect(onLocate).not.toHaveBeenCalled();
  });

  it('marks the changed line and the player pick with text in review', () => {
    const solution = solutionIndex(find);
    const wrong = solution === 0 ? 1 : 0;
    render(
      <CodeScanContentView
        challenge={find}
        phase="review"
        locate={binding({ disabled: true, solutionIndex: solution, selectedIndex: wrong })}
      />,
    );
    expect(
      screen.getByRole('button', { name: new RegExp(`^Line ${solution + 1}: .*\\(changed\\)$`) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: new RegExp(`^Line ${wrong + 1}: .*\\(your pick\\)$`) }),
    ).toBeInTheDocument();
    expect(within(copyColumn()).getByText('changed')).toBeInTheDocument();
    expect(within(copyColumn()).getByText('your pick')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Original snippet' })).getByText('changed'),
    ).toBeInTheDocument();
  });

  it('does not reveal the change before review', () => {
    render(<CodeScanContentView challenge={find} phase="respond" locate={binding()} />);
    expect(screen.queryByText('changed')).not.toBeInTheDocument();
  });

  it('points at the line to classify when the level gives a hint', () => {
    const classify = challengeOf('classify-the-change', 7);
    render(<CodeScanContentView challenge={classify} phase="respond" locate={null} />);
    expect(within(copyColumn()).getByText('check')).toBeInTheDocument();
    expect(within(copyColumn()).queryAllByRole('button')).toHaveLength(0);
  });

  it('says the snippets are identical when reviewing an unchanged copy', () => {
    const same = challengeOf('same-or-different', 1, true);
    render(<CodeScanContentView challenge={same} phase="review" locate={null} />);
    expect(screen.getByText(/No line differs/)).toBeInTheDocument();
    expect(screen.queryByText('changed')).not.toBeInTheDocument();
  });
});
