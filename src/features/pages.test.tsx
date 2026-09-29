import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { applySessionResult, emptyProgress } from '@/domain/progress';
import { gameIdOf } from '@/domain/shared';
import { resultFixture } from '@/test/fixtures/results';
import { renderApp } from '@/test/renderApp';

const logicProgress = applySessionResult(
  emptyProgress(),
  resultFixture({
    gameId: gameIdOf('algorithmic-logic'),
    level: 1,
    performanceIndex: 85,
    total: 640,
  }),
);

describe('navigation and pages', () => {
  it('presents the five cognitive areas on the home page and links to the games', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/');
    const list = within(
      screen.getByRole('heading', { name: 'Five cognitive areas' }).parentElement as HTMLElement,
    ).getAllByRole('heading', { level: 3 });
    expect(list.map((h) => h.textContent)).toEqual([
      'Logic',
      'Memory',
      'Speed',
      'Attention',
      'Patterns',
    ]);
    await user.click(screen.getByRole('link', { name: 'Start training' }));
    expect(router.state.location.pathname).toBe('/games');
  });

  it('shows cleared levels in the catalog', async () => {
    renderApp('/games', { progress: logicProgress });
    expect(await screen.findByText('1/10 cleared')).toBeInTheDocument();
  });

  it('suggests the next level, shows the record and starts the chosen level', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/games/algorithmic-logic', { progress: logicProgress });
    expect(await screen.findByRole('radio', { name: 'Level 1, cleared' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Level 2, suggested' })).toBeChecked();

    await user.click(screen.getByRole('radio', { name: 'Level 1, cleared' }));
    expect(screen.getByText('85/100')).toBeInTheDocument();
    expect(screen.getByText('640')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Level 7' }));
    expect(screen.getByText('Not played yet.', { exact: false })).toBeInTheDocument();
    await user.click(screen.getByLabelText(/Relaxed timing/));
    await user.click(screen.getByRole('button', { name: 'Start level 7' }));
    expect(router.state.location.pathname).toBe('/games/algorithmic-logic/play/7');
    expect(router.state.location.search).toBe('?assisted=1');
  });

  it('lists progress and resets it after confirmation', async () => {
    const user = userEvent.setup();
    const { repository } = renderApp('/profile', { progress: logicProgress });
    expect(await screen.findByRole('cell', { name: /^85\s*cleared$/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset progress' }));
    await user.click(screen.getByRole('button', { name: 'Confirm reset' }));
    expect(await screen.findByText('No sessions yet.')).toBeInTheDocument();
    expect(repository.stored).toBeNull();
  });

  it('shows a not-found page for unknown routes', async () => {
    renderApp('/nope');
    expect(await screen.findByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
  });
});
