import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NAV_SECTIONS } from '@/components/navigation/navigation';
import { defaultPreferences } from '@/domain/preferences';
import { applySessionResult, emptyProgress, type ProgressRepository } from '@/domain/progress';
import { gameIdOf } from '@/domain/shared';
import { resultFixture } from '@/test/fixtures/results';
import { FakeClock } from '@/test/fakes/FakeClock';
import { en } from '@/test/i18n';
import { renderApp } from '@/test/renderApp';

const NOW = Date.UTC(2026, 9, 1, 12);
const memoryProgress = applySessionResult(
  emptyProgress(),
  resultFixture({
    gameId: gameIdOf('memory-cards'),
    level: 1,
    performanceIndex: 85,
    total: 640,
    endedAt: NOW - 3_600_000,
    startedAt: NOW - 3_660_000,
  }),
);

describe('navigation and pages', () => {
  it.each(NAV_SECTIONS.flatMap((s) => s.items).map((item) => [en(item.label), item.to] as const))(
    'sidebar entry "%s" leads to a working screen (%s)',
    async (label, to) => {
      renderApp(to, { clock: new FakeClock(NOW) });
      const nav = await screen.findByRole('navigation', { name: 'Main' });
      await waitFor(() => {
        expect(within(nav).getByRole('link', { name: label })).toHaveAttribute(
          'aria-current',
          'page',
        );
      });
      expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Nothing here' })).toBeNull();
    },
  );

  it('collapses the sidebar and remembers it', async () => {
    const user = userEvent.setup();
    const { preferencesRepository } = renderApp('/');
    await user.click(await screen.findByRole('button', { name: 'Collapse sidebar' }));
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(() => {
      expect(preferencesRepository.stored?.sidebarCollapsed).toBe(true);
    });
  });

  it('opens the mobile menu as a dialog and closes it with Escape', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(await screen.findByRole('button', { name: 'Menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Navigation' });
    expect(within(dialog).getByRole('link', { name: 'Memory' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('welcomes a new visitor with a first step, areas and routes', async () => {
    renderApp('/', { clock: new FakeClock(NOW) });
    expect(
      await screen.findByRole('heading', { name: 'Train your mind at your own pace.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Start your first activity/ })).toBeInTheDocument();
    const areas = within(
      screen.getByRole('heading', { name: 'Explore by area' }).closest('section') as HTMLElement,
    );
    expect(areas.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(
      expect.arrayContaining([
        '/train/memory',
        '/train/logic',
        '/train/speed',
        '/train/attention',
        '/train/patterns',
      ]),
    );
    const routes = within(
      screen
        .getByRole('heading', { name: 'Routes for every age and interest' })
        .closest('section') as HTMLElement,
    );
    expect(routes.getByRole('link', { name: /Seniors/ })).toHaveAttribute('href', '/paths/seniors');
    expect(screen.getByText(/after your first activity/)).toBeInTheDocument();
  });

  it('shows a returning player what to continue, real totals and the daily challenge', async () => {
    renderApp('/', { progress: memoryProgress, clock: new FakeClock(NOW) });
    expect(await screen.findByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Play level 2' })).toHaveAttribute(
      'href',
      '/games/memory-cards/play/2',
    );
    const stats = within(
      screen.getByRole('heading', { name: 'Your progress' }).closest('section') as HTMLElement,
    );
    expect(stats.getByText('Sessions').nextElementSibling).toHaveTextContent('1');
    expect(screen.getByRole('link', { name: /Play today’s challenge/ })).toHaveAttribute(
      'href',
      '/daily',
    );
    expect(screen.getByRole('heading', { name: 'Recommended for you' })).toBeInTheDocument();
  });

  it('filters the catalog by area and search', async () => {
    const user = userEvent.setup();
    renderApp('/games', { progress: memoryProgress });
    expect(await screen.findByText('1/10 cleared · 2 open')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Area'), 'memory');
    const cards = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.startsWith('/games/'));
    expect(cards.length).toBeGreaterThanOrEqual(3);
    await user.type(screen.getByLabelText('Search'), 'zzzz-nothing');
    expect(screen.getByText(/No game matches/)).toBeInTheDocument();
  });

  it('opens levels progressively and starts the chosen one', async () => {
    const user = userEvent.setup();
    const { router } = renderApp('/games/memory-cards', { progress: memoryProgress });
    expect(await screen.findByRole('radio', { name: 'Level 1, cleared' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Level 2, suggested' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Level 3, locked' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByText(/How your result is calculated/)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Level 1, cleared' }));
    expect(screen.getByText('85/100')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Level 3, locked' }));
    expect(screen.getByRole('radio', { name: 'Level 1, cleared' })).toBeChecked();
    await user.click(screen.getByLabelText(/Relaxed timing/));
    await user.click(screen.getByRole('button', { name: 'Start level 1' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/games/memory-cards/play/1');
    });
    expect(router.state.location.search).toBe('?assisted=1');
  });

  it('opens every level in free play', async () => {
    renderApp('/games/memory-cards', { preferences: { ...defaultPreferences(), freePlay: true } });
    await screen.findByRole('radio', { name: /^Level 10/ });
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /^Level 10/ })).toHaveAttribute(
        'aria-disabled',
        'false',
      );
    });
  });

  it('shows progress from stored data and resets everything after confirmation', async () => {
    const user = userEvent.setup();
    renderApp('/progress', { progress: memoryProgress });
    expect(await screen.findByRole('heading', { name: 'My progress' })).toBeInTheDocument();
    expect((await screen.findByText('Sessions completed')).nextElementSibling).toHaveTextContent(
      '1',
    );
    expect(screen.getByRole('table')).toHaveTextContent('Memory Cards');

    const { repository } = renderApp('/settings/data', { progress: memoryProgress });
    await user.click(await screen.findByRole('button', { name: 'Reset all data…' }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete everything' }));
    expect(await screen.findByText(/All data was deleted/)).toBeInTheDocument();
    expect(repository.stored).toBeNull();
  });

  it('applies the seniors route: suggested settings, curated games, no limits on access', async () => {
    const user = userEvent.setup();
    const { preferencesRepository } = renderApp('/paths/seniors');
    await user.click(await screen.findByRole('button', { name: 'Make this my route' }));
    await waitFor(() => {
      expect(preferencesRepository.stored).toMatchObject({
        path: 'seniors',
        textSize: 'large',
        relaxedByDefault: true,
      });
    });
    expect(document.documentElement.dataset['textSize']).toBe('large');
    expect(screen.getByRole('heading', { name: 'Activities in this route' })).toBeInTheDocument();
  });

  it('changes accessibility settings immediately', async () => {
    const user = userEvent.setup();
    renderApp('/settings/accessibility');
    await user.click(await screen.findByRole('radio', { name: 'Extra large' }));
    expect(document.documentElement.dataset['textSize']).toBe('x-large');
    await user.click(screen.getByRole('switch', { name: 'Reduce motion' }));
    expect(document.documentElement.dataset['motion']).toBe('reduce');
  });

  it('redirects the old profile address to progress', async () => {
    const { router } = renderApp('/profile');
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/progress');
    });
  });

  it('shows a not-found page for unknown routes', async () => {
    renderApp('/nope');
    expect(await screen.findByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
  });

  it('keeps the shell usable and explains the failure when a screen crashes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const crashing: ProgressRepository = {
      get: () => {
        throw new Error('storage exploded');
      },
      save: () => Promise.resolve(),
      clear: () => Promise.resolve(),
    };
    renderApp('/progress', { repository: crashing });
    expect(
      await screen.findByRole('heading', { name: 'Something went wrong' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/storage exploded/)).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('warns when progress can only live until the tab closes', async () => {
    renderApp('/', { persistence: 'session-only' });
    expect(
      await screen.findByText(/progress will be lost when you close the tab/),
    ).toBeInTheDocument();
  });

  it('lets a new visitor pick a route and a weekly target', async () => {
    const user = userEvent.setup();
    const { router, profileRepository, preferencesRepository } = renderApp('/start', {
      clock: new FakeClock(NOW),
    });
    await user.click(await screen.findByRole('radio', { name: /Kids/ }));
    await user.selectOptions(screen.getByLabelText(/days a week/), '3');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/paths/kids');
    });
    expect(profileRepository.stored).toMatchObject({ weeklyTarget: 3, goal: 'train' });
    expect(preferencesRepository.stored?.path).toBe('kids');
  });
});
