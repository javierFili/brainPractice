import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { glyphKey } from '@/games/kit/content';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { memoryCardsGame } from './content/definition';
import { MEMORY_CARDS_LEVELS } from './content/levels';
import { memoryCardsModule } from './index';
import { MemoryCardsView } from './ui/MemoryCardsView';

describeGameContract(memoryCardsModule);

const faceKey = (face: (typeof generated)['content']['faces'][number]) =>
  face.type === 'object' ? face.objectId : glyphKey(face.glyph);
const generated = generateChallenge(memoryCardsGame, { level: 7, seed: toSeed(5) });

describe('Memory Cards content', () => {
  it('puts every face on exactly two cards and the solution pairs them', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const challenge = generateChallenge(memoryCardsGame, { level, seed: toSeed(level * 13) });
      const { faces } = challenge.content;
      const counts = new Map<string, number>();
      for (const face of faces) counts.set(faceKey(face), (counts.get(faceKey(face)) ?? 0) + 1);
      expect([...counts.values()].every((n) => n === 2)).toBe(true);
      expect(counts.size).toBe(MEMORY_CARDS_LEVELS[level].pairs);
      if (challenge.response.format !== 'pairs') throw new Error('pairs expected');
      for (const [a, b] of challenge.response.solution.pairs) {
        expect(faceKey(faces[a] as never)).toBe(faceKey(faces[b] as never));
      }
    }
  });

  it('grows the board and removes the preview as levels rise', () => {
    expectNonDecreasing(MEMORY_CARDS_LEVELS, (p) => p.pairs, 'pairs');
    expect(MEMORY_CARDS_LEVELS[1].timing.studyMs).not.toBeNull();
    expect(MEMORY_CARDS_LEVELS[10].timing.studyMs).toBeNull();
  });

  it('makes near-glyph boards out of look-alike couples', () => {
    const { faces } = generated.content;
    const glyphs = faces.flatMap((f) => (f.type === 'glyph' ? [f.glyph] : []));
    const lookAlike = glyphs.filter((g) =>
      glyphs.some(
        (o) => glyphKey(o) !== glyphKey(g) && (o.shape === g.shape || o.color === g.color),
      ),
    );
    expect(lookAlike.length).toBe(glyphs.length);
  });
});

describe('Memory Cards board', () => {
  it('reports every turned pair and submits once all pairs are found', async () => {
    const user = userEvent.setup();
    const challenge = generateChallenge(memoryCardsGame, { level: 1, seed: toSeed(3) });
    if (challenge.response.format !== 'pairs') throw new Error('pairs expected');
    const respond = vi.fn();
    render(
      <MemoryCardsView
        challenge={challenge}
        phase="respond"
        locate={null}
        respond={respond}
        answer={null}
        assisted={false}
      />,
    );
    const cards = screen.getAllByRole('button');
    expect(cards).toHaveLength(6);
    expect(cards[0]).toHaveAccessibleName(/face down/);
    for (const [a, b] of challenge.response.solution.pairs) {
      await user.click(cards[a] as HTMLElement);
      await user.click(cards[b] as HTMLElement);
    }
    expect(respond).toHaveBeenCalledTimes(1);
    expect(respond).toHaveBeenCalledWith({
      format: 'pairs',
      attempts: challenge.response.solution.pairs,
    });
  });

  it('submits as a failed board once the misses exceed the budget', async () => {
    const user = userEvent.setup();
    const challenge = generateChallenge(memoryCardsGame, { level: 1, seed: toSeed(3) });
    if (challenge.response.format !== 'pairs') throw new Error('pairs expected');
    const respond = vi.fn();
    render(
      <MemoryCardsView
        challenge={challenge}
        phase="respond"
        locate={null}
        respond={respond}
        answer={null}
        assisted={false}
      />,
    );
    const [[a0], [b0]] = challenge.response.solution.pairs as [[number, number], [number, number]];
    for (let i = 0; i <= challenge.response.question.maxMisses; i++) {
      await user.click(screen.getAllByRole('button')[a0] as HTMLElement);
      await user.click(screen.getAllByRole('button')[b0] as HTMLElement);
    }
    expect(respond).toHaveBeenCalledTimes(1);
    const attempts = (respond.mock.calls[0]?.[0] as { attempts: unknown[] }).attempts;
    expect(attempts).toHaveLength(challenge.response.question.maxMisses + 1);
  });
});
