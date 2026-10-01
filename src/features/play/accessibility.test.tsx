import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { bugHunterModule } from '@/games/bug-hunter';
import { bugHunterGame } from '@/games/bug-hunter/content/definition';
import { describeLabel } from '@/games/pattern-architect/content/format';
import { renderApp } from '@/test/renderApp';
import { ChallengeStage } from './ChallengeStage';

const challenge = generateChallenge(bugHunterGame, { level: 1, seed: 3 });

function stage(onAnswer = vi.fn()) {
  render(
    <ChallengeStage
      module={bugHunterModule}
      challenge={challenge}
      status="responding"
      record={null}
      isLast={false}
      onAnswer={onAnswer}
      onEndStudy={vi.fn()}
      onNext={vi.fn()}
    />,
  );
  return onAnswer;
}

const itemButtons = () =>
  screen.getAllByRole('button').filter((b) => !/Confirm|Cancel/.test(b.textContent));

describe('game accessibility', () => {
  it('moves between answer items with the arrow keys', async () => {
    const user = userEvent.setup();
    stage();
    const [first, second] = itemButtons();
    first?.focus();
    await user.keyboard('{ArrowDown}');
    expect(second).toHaveFocus();
    await user.keyboard('{End}');
    expect(itemButtons().at(-1)).toHaveFocus();
    await user.keyboard('{Home}');
    expect(first).toHaveFocus();
  });

  it('asks to confirm a tap on touch screens before answering', async () => {
    const user = userEvent.setup();
    // jsdom has no matchMedia; pretend to be a touch screen for this test only.
    window.matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList);
    const onAnswer = (() => {
      try {
        return stage();
      } finally {
        Reflect.deleteProperty(window, 'matchMedia');
      }
    })();
    await user.click(itemButtons()[1] as HTMLElement);
    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.getByText('Selected item 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onAnswer).toHaveBeenCalledWith({ format: 'locate', index: 1 });
  });

  it('answers on the first click with a mouse', async () => {
    const user = userEvent.setup();
    const onAnswer = stage();
    await user.click(itemButtons()[0] as HTMLElement);
    expect(onAnswer).toHaveBeenCalledWith({ format: 'locate', index: 0 });
  });

  it('reads symbol options as words', () => {
    expect(describeLabel('▲▲▲')).toBe('3 triangles');
    expect(describeLabel('★')).toBe('1 star');
    expect(describeLabel('▲■')).toBeUndefined();
    expect(describeLabel('42')).toBeUndefined();
  });

  it('selects levels with the arrow keys like a radio group', async () => {
    const user = userEvent.setup();
    await import('@/features/game-intro/GameIntroPage');
    renderApp('/games/code-scan');
    const one = await screen.findByRole('radio', { name: /^Level 1(,|$)/ });
    expect(one).toHaveAttribute('tabindex', '0');
    one.focus();
    await user.keyboard('{ArrowRight}');
    const two = screen.getByRole('radio', { name: /^Level 2(,|$)/ });
    expect(two).toHaveAttribute('aria-checked', 'true');
    expect(two).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('radio', { name: /^Level 10/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
