import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import {
  describeGameContract,
  expectDistinctLevels,
  expectNonDecreasing,
} from '@/test/gameContract';
import { meanGenerationMs, sweep } from '../shared/testing';
import { codeScanSprintGame } from './content/definition';
import { CODE_SCAN_SPRINT_LEVELS } from './content/levels';
import type { CodeScanSprintContent } from './content/types';
import { codeScanSprintModule } from './index';
import { CodeScanSprintView } from './ui/CodeScanSprintView';

describeGameContract(codeScanSprintModule);

const all = sweep(codeScanSprintGame, 50);

/** Reads the query straight from the line text (independent of the generator's facts). */
function matchingLines({ kind, subject, lines }: CodeScanSprintContent): number[] {
  const words = (text: string): string[] => text.match(/[a-z]+|\d+/g) ?? [];
  const assigns = (text: string) => text.startsWith(`${subject} ←`);
  const all = lines.map((l, i) => ({ text: l.text, i }));
  switch (kind) {
    case 'call':
      return all.filter((l) => l.text.startsWith(`${subject}(`)).map((l) => l.i);
    case 'number':
      return all.filter((l) => words(l.text).includes(subject)).map((l) => l.i);
    case 'first-assign':
      return all
        .filter((l) => assigns(l.text))
        .slice(0, 1)
        .map((l) => l.i);
    case 'last-assign':
      return all
        .filter((l) => assigns(l.text))
        .slice(-1)
        .map((l) => l.i);
    case 'condition':
      return all
        .filter((l) => /^(if|while) /.test(l.text) && words(l.text).includes(subject))
        .map((l) => l.i);
  }
}

describe('Code Scan (sprint) content', () => {
  it('has exactly one line answering each question, and it is the solution', () => {
    for (const { challenge } of all) {
      const matches = matchingLines(challenge.content);
      expect(matches).toHaveLength(1);
      expect(challenge.response).toMatchObject({
        format: 'locate',
        solution: { index: matches[0] },
      });
    }
  });

  it('makes assignment questions non-trivial at the levels that ask them', () => {
    for (const { level, challenge } of all) {
      const { kind, subject, lines } = challenge.content;
      if (kind !== 'first-assign' && kind !== 'last-assign') continue;
      const assigned = lines.filter((l) => l.text.startsWith(`${subject} ←`)).length;
      const needed = kind === 'last-assign' ? 2 : CODE_SCAN_SPRINT_LEVELS[level].minAssignments;
      expect(assigned).toBeGreaterThanOrEqual(needed);
    }
  });

  it('uses the level’s line count, keeps lines short and nests only as allowed', () => {
    for (const { level, challenge } of all) {
      const p = CODE_SCAN_SPRINT_LEVELS[level];
      expect(challenge.content.lines).toHaveLength(p.lineCount);
      for (const line of challenge.content.lines) {
        expect(line.indent).toBeLessThanOrEqual(p.maxDepth);
        expect(line.text.length + line.indent * 2).toBeLessThanOrEqual(28);
      }
    }
  });

  it('spreads the answer over the listing', () => {
    const atFirst = all.filter(({ challenge }) =>
      challenge.response.format === 'locate' ? challenge.response.solution.index === 0 : false,
    ).length;
    expect(atFirst / all.length).toBeLessThan(0.4);
    const late = all.filter(({ challenge }) =>
      challenge.response.format === 'locate'
        ? challenge.response.solution.index >= challenge.content.lines.length / 2
        : false,
    ).length;
    expect(late / all.length).toBeGreaterThan(0.25);
  });

  it('lengthens listings and adds nesting and decoys across levels', () => {
    expectDistinctLevels(CODE_SCAN_SPRINT_LEVELS);
    expectNonDecreasing(CODE_SCAN_SPRINT_LEVELS, (p) => p.lineCount, 'lines');
    expectNonDecreasing(CODE_SCAN_SPRINT_LEVELS, (p) => p.maxDepth, 'depth');
    expectNonDecreasing(CODE_SCAN_SPRINT_LEVELS, (p) => p.minAssignments, 'decoys');
    expectNonDecreasing(CODE_SCAN_SPRINT_LEVELS, (p) => p.variables, 'variables');
    expect(Object.keys(CODE_SCAN_SPRINT_LEVELS[1].kinds)).toEqual(['call']);
  });

  it('generates quickly', () => {
    expect(meanGenerationMs(codeScanSprintGame)).toBeLessThan(5);
  });
});

describe('Code Scan (sprint) view', () => {
  const challenge = generateChallenge(codeScanSprintGame, { level: 6, seed: toSeed(3) });
  const solution = challenge.response.format === 'locate' ? challenge.response.solution.index : -1;

  it('locates the pressed line', async () => {
    const onLocate = vi.fn();
    render(
      <CodeScanSprintView
        challenge={challenge}
        phase="respond"
        locate={{ disabled: false, selectedIndex: null, solutionIndex: null, onLocate }}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: new RegExp(`^Line ${solution + 1}:`) }),
    );
    expect(onLocate).toHaveBeenCalledWith(solution);
  });

  it('marks the answer and a wrong pick with text in review', () => {
    const wrong = solution === 0 ? 1 : 0;
    render(
      <CodeScanSprintView
        challenge={challenge}
        phase="review"
        locate={{
          disabled: true,
          selectedIndex: wrong,
          solutionIndex: solution,
          onLocate: vi.fn(),
        }}
        respond={null}
        answer={{ format: 'locate', index: wrong }}
        assisted={false}
      />,
    );
    expect(screen.getByText('✓ answer')).toBeInTheDocument();
    expect(screen.getByText('✗ your pick')).toBeInTheDocument();
  });
});
