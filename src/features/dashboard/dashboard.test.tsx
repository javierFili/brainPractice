import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dailyChallenge } from '@/domain/insights';
import { completeOnboarding, emptyProfile, recordActivity, recordDaily } from '@/domain/profile';
import { dayKeyOf } from '@/features/shared/days';
import { FakeClock } from '@/test/fakes/FakeClock';
import { renderApp } from '@/test/renderApp';

const NOW = Date.UTC(2026, 9, 1, 12);
const today = dayKeyOf(NOW);
const onboarded = completeOnboarding(emptyProfile(), { goal: 'both', weeklyTarget: 3, at: NOW });
const GAMES = ['algorithmic-logic', 'code-memory', 'code-scan', 'bug-hunter', 'pattern-architect'];

describe('Dashboard', () => {
  beforeAll(async () => {
    await import('@/features/home/HomePage');
  });

  it('shows returning learners what to do today, with reasons, and where they stand', async () => {
    renderApp('/', { profile: recordActivity(onboarded, today), clock: new FakeClock(NOW) });
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    const todayList = within(
      screen.getByRole('heading', { name: 'Today' }).parentElement as HTMLElement,
    );
    expect(todayList.getByRole('link', { name: /Lesson: What is a Program\?/ })).toHaveAttribute(
      'href',
      '/learn/what-is-a-program',
    );
    expect(todayList.getByRole('link', { name: /Daily challenge/ })).toHaveAttribute(
      'href',
      '/daily',
    );
    expect(todayList.getByRole('link', { name: /You are learning programs/ })).toBeInTheDocument();
    expect(screen.getByText(/not intelligence/)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 10 lessons/)).toBeInTheDocument();
  });
});

describe('Onboarding', () => {
  beforeAll(async () => {
    await import('@/features/onboarding/OnboardingPage');
  });

  it('lets a new visitor choose a goal and a weekly target, then starts the first lesson', async () => {
    const user = userEvent.setup();
    const { router, profileRepository } = renderApp('/start', { clock: new FakeClock(NOW) });
    await user.click(await screen.findByRole('button', { name: 'Skip, choose my goal' }));
    await user.click(screen.getByRole('radio', { name: /Learn programming logic/ }));
    await user.click(screen.getByRole('button', { name: 'Start the first lesson' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/learn/what-is-a-program');
    });
    expect(profileRepository.stored).toMatchObject({
      goal: 'learn',
      weeklyTarget: 4,
      onboardedAt: NOW,
    });
  });

  it('opens with a short warm-up session', async () => {
    const user = userEvent.setup();
    renderApp('/start');
    await user.click(await screen.findByRole('button', { name: 'Start the challenge' }));
    expect(await screen.findByText('1 / 3')).toBeInTheDocument();
  });
});

describe('Daily challenge', () => {
  beforeAll(async () => {
    await import('@/features/daily/DailyPage');
  });

  it('offers today’s shared challenge as a 5-problem session', async () => {
    const user = userEvent.setup();
    renderApp('/daily', { profile: onboarded, clock: new FakeClock(NOW) });
    await user.click(await screen.findByRole('button', { name: /Start today.s challenge/ }));
    expect(await screen.findByText('1 / 5')).toBeInTheDocument();
  });

  it('says when today’s challenge is already done', async () => {
    const daily = dailyChallenge(today, GAMES, {});
    const profile = recordDaily(onboarded, today, {
      gameId: daily.gameId,
      level: daily.level,
      seed: daily.seed,
      performanceIndex: 84,
      completedAt: NOW,
    });
    renderApp('/daily', { profile, clock: new FakeClock(NOW) });
    expect(await screen.findByText(/Done for today — performance 84\/100/)).toBeInTheDocument();
  });
});
