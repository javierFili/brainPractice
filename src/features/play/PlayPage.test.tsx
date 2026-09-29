import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FakeClock } from '@/test/fakes/FakeClock';
import { choiceLabels, seedWhereFirst, sessionChallenge } from '@/test/challenges';
import { renderApp } from '@/test/renderApp';

const PATH = '/games/algorithmic-logic/play';
const choiceSeed = seedWhereFirst(1, 'single-choice');

async function waitForChallenge() {
  // The session starts measuring after paint; answers are enabled once it is responding.
  await waitFor(() => {
    expect(screen.getAllByRole('button').find((b) => b.textContent.includes('1'))).toBeEnabled();
  });
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Option buttons are named by their label (the shortcut digit is aria-hidden). */
const option = (label: string) =>
  screen.getByRole('button', { name: new RegExp(`^${escape(label)}$`) });

describe('Play screen', () => {
  // Load the lazy route module up front so fake-timer tests do not wait on a dynamic import.
  beforeAll(async () => {
    await import('./PlayPage');
  });

  it('answers correctly, updates the score, advances, and saves the result when the session ends', async () => {
    const user = userEvent.setup();
    const clock = new FakeClock();
    const { repository } = renderApp(`${PATH}/1?seed=${choiceSeed}`, { clock });
    const first = sessionChallenge(1, choiceSeed);
    expect(await screen.findByRole('heading', { name: first.prompt })).toBeInTheDocument();
    expect(screen.getByText('1 / 6')).toBeInTheDocument();
    await waitForChallenge();

    clock.advance(3000);
    await user.click(option(choiceLabels(first).correct));

    expect(await screen.findByRole('status', { name: '' })).toHaveTextContent(/Correct/);
    expect(screen.getByText(first.explanation)).toBeInTheDocument();
    const score = within(screen.getByText('Score').parentElement as HTMLElement).getByText(/\d/);
    expect(Number(score.textContent.replace(',', ''))).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Next challenge/ }));
    expect(await screen.findByText('2 / 6')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'End session' }));
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Session ended early/)).toBeInTheDocument();
    await waitFor(() => {
      expect(repository.stored?.recentSessions).toHaveLength(1);
    });
    expect(repository.stored?.recentSessions[0]).toMatchObject({
      gameId: 'algorithmic-logic',
      level: 1,
      seed: choiceSeed,
      completed: false,
    });
    expect(screen.getByText('Progress saved on this device.')).toBeInTheDocument();
  });

  it('shows the correct answer and explanation after a wrong answer, and resets the streak', async () => {
    const user = userEvent.setup();
    renderApp(`${PATH}/1?seed=${choiceSeed}`);
    const first = sessionChallenge(1, choiceSeed);
    await waitForChallenge();
    await user.click(option(choiceLabels(first).wrong));

    const feedback = await screen.findByText('Incorrect');
    expect(feedback).toBeInTheDocument();
    expect(screen.getByText(/✗ Your answer/)).toBeInTheDocument();
    expect(screen.getByText(/✓ Correct answer/)).toBeInTheDocument();
    expect(screen.getByText(first.explanation)).toBeInTheDocument();
    expect(
      within(screen.getByText('Streak').parentElement as HTMLElement).getByText('0'),
    ).toBeInTheDocument();
  });

  it('supports answering with the number keys', async () => {
    const user = userEvent.setup();
    renderApp(`${PATH}/1?seed=${choiceSeed}`);
    await waitForChallenge();
    await user.keyboard('1');
    expect(await screen.findByRole('button', { name: /Next challenge/ })).toHaveFocus();
  });

  it('times out when the limit elapses', async () => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'Date',
        'requestAnimationFrame',
        'cancelAnimationFrame',
      ],
    });
    try {
      const clock = { now: () => Date.now() };
      renderApp(`${PATH}/1?seed=${choiceSeed}`, { clock });
      // The lazy route resolves over a few event-loop turns; step until the countdown shows.
      for (let i = 0; i < 50 && !screen.queryByText('90s'); i++)
        await vi.advanceTimersByTimeAsync(1);
      expect(screen.getByText('90s')).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(90_000);
      expect(screen.getByText("Time's up")).toBeInTheDocument();
      expect(screen.getByText(/no answer/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('has no time limit in relaxed mode', async () => {
    renderApp(`${PATH}/1?seed=${choiceSeed}&assisted=1`);
    await waitForChallenge();
    expect(screen.getByText('Relaxed timing')).toBeInTheDocument();
    expect(screen.queryByText(/^\d+s$/)).not.toBeInTheDocument();
  });

  it('accepts exact numeric answers and validates empty input', async () => {
    const user = userEvent.setup();
    const seed = seedWhereFirst(4, 'numeric');
    const first = sessionChallenge(4, seed);
    renderApp(`${PATH}/4?seed=${seed}`);
    const input = await screen.findByLabelText(/Your answer/);
    await waitFor(() => {
      expect(input).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number.');
    const value = first.response.format === 'numeric' ? first.response.solution.value : Number.NaN;
    await user.type(input, `${value}{Enter}`);
    expect(await screen.findByText('Correct')).toBeInTheDocument();
  });

  it('reproduces the same challenge for the same seed', async () => {
    const first = sessionChallenge(7, 1234);
    renderApp(`${PATH}/7?seed=1234`);
    expect(await screen.findByRole('heading', { name: first.prompt })).toBeInTheDocument();
  });

  it.each([
    '/games/algorithmic-logic/play/11',
    '/games/algorithmic-logic/play/3?seed=abc',
    '/games/unknown/play/1',
  ])('rejects %s', async (path) => {
    renderApp(path);
    expect(await screen.findByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
  });
});
