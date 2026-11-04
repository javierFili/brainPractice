import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { ALL_RESOURCES } from '@/test/i18n';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { errorDetectionGame } from './content/definition';
import { rowTexts } from './content/format';
import { ERROR_DETECTION_LEVELS } from './content/levels';
import type { ErrorDetectionContent } from './content/types';
import { errorDetectionModule } from './index';
import { ErrorDetectionView } from './ui/ErrorDetectionView';

describeGameContract(errorDetectionModule);

const LANGUAGES = ['es', 'en', 'it', 'fr', 'de'] as const;

/** Each language's word list, read straight from the translation files. */
const dictionary = (language: string) =>
  new Set(
    Object.values(
      (ALL_RESOURCES[language]?.['kit'] as { words: Record<string, string> } | undefined)?.words ??
        {},
    ),
  );

/** Rows that, removed, leave the list in order. */
function outOfPlace(values: readonly (number | string)[], language: string): number[] {
  const sortedWithout = (skip: number) => {
    const rest = values.filter((_, j) => j !== skip);
    return rest.every(
      (v, j) =>
        j === 0 || String(rest[j - 1]).localeCompare(String(v), language, { numeric: true }) < 0,
    );
  };
  return values.flatMap((_, i) => (sortedWithout(i) ? [i] : []));
}

/** Independent oracle written against the printed meaning of each list, in every language. */
function oracle(content: ErrorDetectionContent): number[] {
  const everywhere = (rows: (language: (typeof LANGUAGES)[number]) => number[]) => {
    const all = LANGUAGES.map((language) => rows(language));
    // The wrong row must be the same whatever language the list is read in.
    for (const found of all) expect(found).toEqual(all[0]);
    return all[0] ?? [];
  };
  switch (content.kind) {
    case 'sorted': {
      const { words } = content;
      if (words === null) return outOfPlace(content.values, 'en');
      return everywhere((language) => outOfPlace(words[language], language));
    }
    case 'receipt': {
      const wrong = content.lines.flatMap((l, i) =>
        l.quantity * l.priceCents === l.totalCents ? [] : [i],
      );
      const sum = content.lines.reduce((s, l) => s + l.totalCents, 0);
      return content.totalCents !== null && content.totalCents !== sum
        ? [...wrong, content.lines.length]
        : wrong;
    }
    case 'schedule':
      return content.events.flatMap((e, i) => (e.start + e.minutes === e.end ? [] : [i]));
    case 'spelling': {
      const { words } = content;
      return everywhere((language) => {
        const known = dictionary(language);
        return words[language].flatMap((w, i) => (known.has(w) ? [] : [i]));
      });
    }
    case 'copy':
      return content.pairs.flatMap((p, i) => (p.copy === p.original ? [] : [i]));
  }
}

describe('Error Detection', () => {
  it('every list has exactly one wrong row, and it is the solution', () => {
    const kinds = new Set<string>();
    for (const level of DIFFICULTY_LEVELS) {
      for (const seed of contractSeeds(40)) {
        const c = generateChallenge(errorDetectionGame, { level, seed });
        if (c.response.format !== 'locate') throw new Error('locate expected');
        expect(oracle(c.content)).toEqual([c.response.solution.index]);
        expect(rowTexts(c.content)).toHaveLength(ERROR_DETECTION_LEVELS[level].items);
        kinds.add(c.content.kind);
      }
    }
    expect(kinds.size).toBe(5);
  });

  it('lengthens the lists', () => {
    expectNonDecreasing(ERROR_DETECTION_LEVELS, (p) => p.items, 'items');
    expectNonDecreasing(ERROR_DETECTION_LEVELS, (p) => (p.subtle ? 1 : 0), 'subtle');
  });

  it('answers by pressing a row', async () => {
    const c = generateChallenge(errorDetectionGame, { level: 3, seed: toSeed(2) });
    const onLocate = vi.fn();
    render(
      <ErrorDetectionView
        challenge={c}
        phase="respond"
        locate={{ disabled: false, selectedIndex: null, solutionIndex: null, onLocate }}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: /^Row 2: / }));
    expect(onLocate).toHaveBeenCalledWith(1);
  });
});
