import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import type { LocateBinding } from '@/games/types';
import { bugHunterGame } from '../content/definition';
import type { AttentionChallenge } from '../content/types';
import { BugHunterContentView } from './BugHunterContentView';

const challenge: AttentionChallenge = generateChallenge(bugHunterGame, { level: 4, seed: 11 });
const solution = challenge.response.format === 'locate' ? challenge.response.solution.index : -1;
const wrong = (solution + 1) % 14;

const onLocate = vi.fn<(index: number) => void>();

beforeEach(() => {
  onLocate.mockReset();
});

const binding = (overrides: Partial<LocateBinding> = {}): LocateBinding => ({
  disabled: false,
  selectedIndex: null,
  solutionIndex: null,
  onLocate,
  ...overrides,
});

const item = (n: number) => screen.getByRole('button', { name: new RegExp(`^Item ${n}: `) });

describe('BugHunterContentView', () => {
  it('shows the rules and every item as a numbered button', () => {
    render(
      <BugHunterContentView
        challenge={challenge}
        phase="respond"
        locate={binding()}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    expect(screen.getByRole('heading', { name: /Rules/ })).toBeInTheDocument();
    expect(screen.getByText('R1')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Item \d+: / })).toHaveLength(14);
  });

  it('locates the item the player clicks', async () => {
    const user = userEvent.setup();
    const locate = binding();
    render(
      <BugHunterContentView
        challenge={challenge}
        phase="respond"
        locate={locate}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    await user.click(item(3));
    expect(onLocate).toHaveBeenCalledWith(2);
  });

  it('is keyboard accessible', async () => {
    const user = userEvent.setup();
    const locate = binding();
    render(
      <BugHunterContentView
        challenge={challenge}
        phase="respond"
        locate={locate}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    item(5).focus();
    await user.keyboard('{Enter}');
    expect(onLocate).toHaveBeenCalledWith(4);
  });

  it('ignores clicks while the binding is disabled', async () => {
    const user = userEvent.setup();
    const locate = binding({ disabled: true });
    render(
      <BugHunterContentView
        challenge={challenge}
        phase="respond"
        locate={locate}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    expect(item(1)).toBeDisabled();
    await user.click(item(1));
    expect(onLocate).not.toHaveBeenCalled();
  });

  it('in review, marks the bug with the broken rule and the player pick in text', () => {
    render(
      <BugHunterContentView
        challenge={challenge}
        phase="review"
        locate={binding({ disabled: true, selectedIndex: wrong, solutionIndex: solution })}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    expect(item(solution + 1)).toHaveAccessibleName(/✗ breaks rule R\d: /);
    expect(item(wrong + 1)).toHaveAccessibleName(/— your pick$/);
    expect(screen.getAllByText(/✗ breaks rule/)).toHaveLength(1);
    expect(screen.getByText('your pick')).toBeInTheDocument();
  });

  it('in review, confirms a correct pick', () => {
    render(
      <BugHunterContentView
        challenge={challenge}
        phase="review"
        locate={binding({ disabled: true, selectedIndex: solution, solutionIndex: solution })}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    expect(item(solution + 1)).toHaveAccessibleName(/✗ breaks rule .* — ✓ your pick$/);
  });

  it('reveals nothing while answering', () => {
    render(
      <BugHunterContentView
        challenge={challenge}
        phase="respond"
        locate={binding({ solutionIndex: null })}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    expect(screen.queryByText(/breaks rule/)).not.toBeInTheDocument();
  });
});
