import { render, screen } from '@testing-library/react';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import {
  describeGameContract,
  expectDistinctLevels,
  expectNonDecreasing,
} from '@/test/gameContract';
import { meanGenerationMs, sweep } from '@/games/speed/shared/testing';
import { AMBIGUOUS_OBJECTS, rapidClassificationGame } from './content/definition';
import { RAPID_CLASSIFICATION_LEVELS } from './content/levels';
import { rapidClassificationModule } from './index';
import { RapidClassificationView } from './ui/RapidClassificationView';

describeGameContract(rapidClassificationModule);

const KIND_RANK = { picture: 0, word: 1, switch: 2 } as const;

describe('Rapid Classification content', () => {
  const all = sweep(rapidClassificationGame, 60);

  it('marks exactly the right group or letter range (independent oracle)', () => {
    for (const { level, challenge: c } of all) {
      if (c.response.format !== 'single-choice') throw new Error('single-choice expected');
      const { solution, question } = c.response;
      const answer = question.options.find((o) => o.id === solution.optionId)?.label;
      const { item, rule } = c.content;
      const profile = RAPID_CLASSIFICATION_LEVELS[level];
      expect(AMBIGUOUS_OBJECTS.has(item.name)).toBe(false);
      expect(profile.categories).toContain(item.category);
      if (rule === 'category') {
        const groups = question.options.map((o) => o.label.toLowerCase());
        expect(groups).toEqual(profile.categories);
        expect(groups.filter((g) => g === item.category)).toHaveLength(1);
        expect(answer?.toLowerCase()).toBe(item.category);
      } else {
        expect(profile.kind).toBe('switch');
        const code = item.name.toUpperCase().charCodeAt(0);
        expect(answer).toBe(code <= 'M'.charCodeAt(0) ? 'A–M' : 'N–Z');
      }
    }
  });

  it('never offers two groups an object could share', () => {
    for (const p of Object.values(RAPID_CLASSIFICATION_LEVELS)) {
      expect(p.categories.includes('fruit') && p.categories.includes('food')).toBe(false);
      expect(p.categories).not.toContain('nature');
    }
  });

  it('uses both rules in switch levels and only the group rule elsewhere', () => {
    for (const level of [7, 10] as const) {
      const rules = new Set(
        all.filter((e) => e.level === level).map((e) => e.challenge.content.rule),
      );
      expect(rules).toEqual(new Set(['category', 'letter']));
    }
    for (const { level, challenge } of all) {
      if (RAPID_CLASSIFICATION_LEVELS[level].kind !== 'switch')
        expect(challenge.content.rule).toBe('category');
    }
  });

  it('progresses: tighter limits, words, then switching', () => {
    expectDistinctLevels(RAPID_CLASSIFICATION_LEVELS);
    expectNonDecreasing(RAPID_CLASSIFICATION_LEVELS, (p) => -(p.timing.limitMs ?? 0), 'limit');
    expectNonDecreasing(RAPID_CLASSIFICATION_LEVELS, (p) => KIND_RANK[p.kind], 'kind');
    expectNonDecreasing(RAPID_CLASSIFICATION_LEVELS, (p) => p.letterShare, 'letter share');
  });

  it('generates fast', () => {
    expect(meanGenerationMs(rapidClassificationGame)).toBeLessThan(5);
  });
});

describe('Rapid Classification view', () => {
  const show = (level: 1 | 5 | 10, seed: number) => {
    const challenge = generateChallenge(rapidClassificationGame, { level, seed: toSeed(seed) });
    render(
      <RapidClassificationView
        challenge={challenge}
        phase="respond"
        locate={null}
        respond={() => undefined}
        answer={null}
        assisted={false}
      />,
    );
    return challenge;
  };

  it('shows a named picture at level 1', () => {
    const c = show(1, 3);
    expect(screen.getByRole('img', { name: c.content.item.name })).toBeInTheDocument();
  });

  it('shows only the word at level 5', () => {
    const c = show(5, 3);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText(c.content.item.name)).toBeInTheDocument();
  });

  it('names the rule in a text cue at level 10', () => {
    const c = show(10, 4);
    expect(
      screen.getByText(c.content.rule === 'category' ? /CATEGORY/ : /FIRST LETTER/),
    ).toBeInTheDocument();
  });
});
