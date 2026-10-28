import { act, fireEvent, render, screen } from '@testing-library/react';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { sameGlyph } from '@/games/kit/content';
import { describeGameContract } from '@/test/gameContract';
import { reactionTestGame } from './content/definition';
import { REACTION_LEVELS } from './content/levels';
import { TapStage } from '@/games/kit/ui';
import { reactionTestModule } from './index';
import { ReactionView } from './ui/ReactionView';

describeGameContract(reactionTestModule);

const trial = (level: 1 | 5 | 10, seed: number) =>
  generateChallenge(reactionTestGame, { level, seed: toSeed(seed) });

describe('Reaction Test content', () => {
  it('shows the target on go trials and something else on stop trials', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (let seed = 0; seed < 40; seed++) {
        const c = generateChallenge(reactionTestGame, { level, seed: toSeed(seed) });
        if (c.response.format !== 'tap') throw new Error('tap expected');
        expect(sameGlyph(c.content.stimulus, c.content.target)).toBe(c.response.solution.shouldTap);
        const [min, max] = REACTION_LEVELS[level].delayMs;
        expect(c.response.question.signalDelayMs).toBeGreaterThanOrEqual(min);
        expect(c.response.question.signalDelayMs).toBeLessThanOrEqual(max);
      }
    }
  });

  it('has only go trials at the simple levels and a share of stop trials later', () => {
    const shouldTap = (level: 1 | 5 | 10) =>
      Array.from({ length: 200 }, (_, seed) => trial(level, seed)).filter(
        (c) => c.response.format === 'tap' && c.response.solution.shouldTap,
      ).length / 200;
    expect(shouldTap(1)).toBe(1);
    expect(shouldTap(5)).toBeGreaterThan(0.55);
    expect(shouldTap(5)).toBeLessThan(0.85);
    expect(shouldTap(10)).toBeLessThan(0.75);
  });
});

describe('Reaction stage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const go = () => {
    for (let seed = 0; ; seed++) {
      const { response } = trial(1, seed);
      if (response.format === 'tap' && response.solution.shouldTap) return response;
    }
  };

  function stage(response: ReturnType<typeof go>, now: () => number = () => 0) {
    const respond = vi.fn();
    render(
      <TapStage
        response={response}
        respond={respond}
        answer={null}
        waiting="+"
        signal="●"
        signalLabel="green circle"
        now={now}
      />,
    );
    return { respond, button: screen.getByRole('button') };
  }

  it('reports the time from signal onset to the tap', () => {
    const response = go();
    let clock = 0;
    const { respond, button } = stage(response, () => clock);
    act(() => {
      clock = response.question.signalDelayMs;
      vi.advanceTimersByTime(response.question.signalDelayMs);
    });
    clock += 280;
    fireEvent.click(button);
    expect(respond).toHaveBeenCalledWith({ format: 'tap', tapped: true, reactionMs: 280 });
  });

  it('reports a false start when tapped before the signal', () => {
    const { respond } = stage(go());
    fireEvent.keyDown(window, { key: ' ' });
    const answer = respond.mock.calls[0]?.[0] as { tapped: boolean; reactionMs: number };
    expect(answer.tapped).toBe(true);
    expect(answer.reactionMs).toBeLessThan(0);
  });

  it('reports no tap once the window closes, and only one answer per trial', () => {
    const response = go();
    const { respond, button } = stage(response);
    act(() => {
      vi.advanceTimersByTime(response.question.signalDelayMs + response.question.windowMs);
    });
    fireEvent.click(button);
    expect(respond).toHaveBeenCalledTimes(1);
    expect(respond).toHaveBeenCalledWith({ format: 'tap', tapped: false, reactionMs: null });
  });

  it('shows the go shape as a cue in cued trials', () => {
    const c = trial(10, 3);
    render(
      <ReactionView
        challenge={c}
        phase="respond"
        locate={null}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    expect(screen.getByText(/go shape/i)).toBeInTheDocument();
  });
});
