import { en } from '@/test/i18n';
import { defaultPreferences } from '@/domain/preferences';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { deriveSeed, toSeed } from '@/domain/random';
import { ASSISTED_STUDY_FACTOR } from '@/domain/session';
import type { DifficultyLevel } from '@/domain/shared';
import { codeMemoryModule } from '@/games/programming/code-memory';
import { codeMemoryGame } from '@/games/programming/code-memory/content/definition';
import { renderApp } from '@/test/renderApp';
import { ChallengeStage } from './ChallengeStage';

const FREE_PLAY = { ...defaultPreferences(), freePlay: true };

const LEVEL: DifficultyLevel = 2;
const firstChallenge = (sessionSeed: number) =>
  generateChallenge(codeMemoryGame, { level: LEVEL, seed: deriveSeed(toSeed(sessionSeed), 0) });
const seed = (() => {
  for (let s = 1; s < 500; s++) {
    const c = firstChallenge(s);
    if (c.timing.studyMs !== null && c.response.format === 'single-choice') return s;
  }
  throw new Error('No memory challenge with a study phase and options');
})();
const challenge = firstChallenge(seed);

describe('Memory study phase', () => {
  beforeAll(async () => {
    await import('./PlayPage');
  });

  it('never shows the question or the options before memorising, not even for one frame', () => {
    render(
      <ChallengeStage
        module={codeMemoryModule}
        challenge={challenge}
        status="presenting"
        record={null}
        isLast={false}
        onAnswer={vi.fn()}
        onEndStudy={vi.fn()}
        onNext={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /Memorise this/ })).toBeInTheDocument();
    expect(screen.queryByText(en(challenge.prompt))).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Answer options' })).not.toBeInTheDocument();
  });

  it('hides the material and asks the question once the player is ready', async () => {
    const user = userEvent.setup();
    renderApp(`/games/code-memory/play/${LEVEL}?seed=${seed}`, { preferences: FREE_PLAY });
    expect(await screen.findByRole('heading', { name: /Memorise this/ })).toBeInTheDocument();
    expect(screen.queryByText(en(challenge.prompt))).not.toBeInTheDocument();

    const ready = await screen.findByRole('button', { name: /I.m ready/ });
    await waitFor(() => {
      expect(ready).toBeEnabled();
    });
    await user.click(ready);
    expect(await screen.findByRole('heading', { name: en(challenge.prompt) })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('group', { name: 'Answer options' })).toBeInTheDocument();
    });
  });

  it('doubles the memorisation time in relaxed mode', async () => {
    const studyMs = challenge.timing.studyMs ?? 0;
    const { unmount } = renderApp(`/games/code-memory/play/${LEVEL}?seed=${seed}`, {
      preferences: FREE_PLAY,
    });
    expect(await screen.findByText(`${Math.ceil(studyMs / 1000)}s`)).toBeInTheDocument();
    unmount();
    renderApp(`/games/code-memory/play/${LEVEL}?seed=${seed}&assisted=1`, {
      preferences: FREE_PLAY,
    });
    expect(
      await screen.findByText(`${Math.ceil((studyMs * ASSISTED_STUDY_FACTOR) / 1000)}s`),
    ).toBeInTheDocument();
  });
});
