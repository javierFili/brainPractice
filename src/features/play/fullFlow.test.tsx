import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { deriveSeed, toSeed } from '@/domain/random';
import { positionMemoryGame } from '@/games/memory/position-memory/content/definition';
import { renderApp } from '@/test/renderApp';

/**
 * Dashboard → area → game → level → play → answers → results → saved → back home, with the real
 * routes and a real game (Position Memory, relaxed timing so no timer is involved).
 */
/** Screens load lazily; a busy machine can take a few seconds for the first render of each. */
const SLOW = { timeout: 10_000 };

describe('end-to-end training flow', () => {
  it('plays a whole session from the dashboard and records it', async () => {
    const user = userEvent.setup();
    const seed = 7;
    const { router, repository } = renderApp('/', { seed });
    await user.click(await screen.findByRole('link', { name: /^Memory.*\d+ games$/ }, SLOW));
    await user.click(await screen.findByRole('link', { name: /Position Memory/ }, SLOW));
    await user.click(await screen.findByLabelText(/Relaxed timing/, {}, SLOW));
    await user.click(screen.getByRole('button', { name: 'Start level 1' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/games/position-memory/play/1');
    });

    const count = positionMemoryGame.levels[1].challengeCount;
    for (let i = 0; i < count; i++) {
      const challenge = generateChallenge(positionMemoryGame, {
        level: 1,
        seed: deriveSeed(toSeed(seed), i),
      });
      await user.click(await screen.findByRole('button', { name: /I.m ready/ }, SLOW));
      for (const index of challenge.content.targets) {
        const name = `row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}`;
        await user.click(await screen.findByRole('button', { name }));
      }
      await user.click(screen.getByRole('button', { name: 'Check' }));
      await user.click(
        await screen.findByRole(
          'button',
          { name: i === count - 1 ? /See results/ : /Continue/ },
          SLOW,
        ),
      );
    }

    expect(
      await screen.findByRole('heading', { name: 'Excellent session' }, SLOW),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(repository.stored?.totals.sessions).toBe(1);
    });
    expect(repository.stored?.recentSessions[0]).toMatchObject({
      gameId: 'position-memory',
      accuracy: 1,
      assisted: true,
    });

    await user.click(screen.getAllByRole('link', { name: 'Home' })[0] as HTMLElement);
    expect(await screen.findByText('Welcome back', {}, SLOW)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue Position Memory/ })).toBeInTheDocument();
  }, 45_000);
});
