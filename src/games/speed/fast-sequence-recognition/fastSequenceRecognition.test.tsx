import { render, screen } from '@testing-library/react';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import {
  describeGameContract,
  expectDistinctLevels,
  expectNonDecreasing,
} from '@/test/gameContract';
import { meanGenerationMs, sweep } from '../shared/testing';
import { fastSequenceRecognitionGame, sequenceLabel } from './content/definition';
import { FAST_SEQUENCE_LEVELS } from './content/levels';
import { fastSequenceRecognitionModule } from './index';
import { FastSequenceView } from './ui/FastSequenceView';

describeGameContract(fastSequenceRecognitionModule);

const all = sweep(fastSequenceRecognitionGame, 60);

const optionsOf = (c: (typeof all)[number]['challenge']) => {
  if (c.response.format !== 'single-choice') throw new Error('choice expected');
  return c.response.question.options;
};

describe('Fast Sequence Recognition content', () => {
  it('offers exactly one candidate equal to the shown sequence, and it is the solution', () => {
    for (const { level, challenge } of all) {
      const { kind, items, glyphs } = challenge.content;
      const shown = sequenceLabel(kind, items, glyphs);
      const options = optionsOf(challenge);
      expect(options).toHaveLength(FAST_SEQUENCE_LEVELS[level].optionCount);
      const same = options.filter((o) => o.label === shown);
      expect(same).toHaveLength(1);
      if (challenge.response.format === 'single-choice')
        expect(same[0]?.id).toBe(challenge.response.solution.optionId);
      expect(new Set(items).size).toBe(items.length);
      expect(items).toHaveLength(FAST_SEQUENCE_LEVELS[level].length);
    }
  });

  it('uses only reorderings at swap-only levels', () => {
    for (const { level, challenge } of all) {
      if (FAST_SEQUENCE_LEVELS[level].changes.includes('substitute')) continue;
      const { kind, items, glyphs } = challenge.content;
      const sorted = sequenceLabel(kind, [...items].sort(), glyphs);
      for (const o of optionsOf(challenge)) {
        const sep = kind === 'shapes' ? ' · ' : ' ';
        expect(o.label.split(sep).sort().join(sep)).toBe(sorted.split(sep).sort().join(sep));
      }
    }
  });

  it('gives shapes distinct outlines, so colour is never needed', () => {
    for (const { challenge } of all) {
      const shapes = Object.values(challenge.content.glyphs).map((g) => g.shape);
      expect(new Set(shapes).size).toBe(shapes.length);
    }
  });

  it('does not let "pick the most typical candidate" beat chance', () => {
    let hits = 0;
    let chance = 0;
    const multi = all.filter(({ challenge }) => optionsOf(challenge).length >= 3);
    for (const { challenge } of multi) {
      const options = optionsOf(challenge);
      const seqs = options.map((o) =>
        o.label.split(challenge.content.kind === 'shapes' ? ' · ' : ' '),
      );
      // Score each option by how many positions agree with the per-position majority.
      const typicality = seqs.map(
        (s) =>
          s.filter((sym, i) => seqs.filter((t) => t[i] === sym).length * 2 > seqs.length).length,
      );
      const best = typicality.indexOf(Math.max(...typicality));
      if (
        challenge.response.format === 'single-choice' &&
        options[best]?.id === challenge.response.solution.optionId
      )
        hits++;
      chance += 1 / options.length;
    }
    expect(hits / multi.length).toBeLessThan(chance / multi.length + 0.12);
  });

  it('lengthens sequences, shortens glimpses and adds candidates across levels', () => {
    expectDistinctLevels(FAST_SEQUENCE_LEVELS);
    expectNonDecreasing(FAST_SEQUENCE_LEVELS, (p) => p.length, 'length');
    expectNonDecreasing(FAST_SEQUENCE_LEVELS, (p) => p.optionCount, 'candidates');
    expectNonDecreasing(FAST_SEQUENCE_LEVELS, (p) => -(p.timing.studyMs ?? 0), 'glimpse');
    for (const p of Object.values(FAST_SEQUENCE_LEVELS))
      expect(p.timing.studyMs).toBeGreaterThanOrEqual(1000);
  });

  it('generates quickly', () => {
    expect(meanGenerationMs(fastSequenceRecognitionGame)).toBeLessThan(5);
  });
});

describe('Fast Sequence Recognition view', () => {
  const challenge = generateChallenge(fastSequenceRecognitionGame, { level: 4, seed: toSeed(2) });
  const props = { challenge, locate: null, respond: null, answer: null, assisted: false };

  it('shows the sequence while studying and hides it while answering', () => {
    const label = `Sequence: ${sequenceLabel(challenge.content.kind, challenge.content.items, challenge.content.glyphs)}`;
    const view = render(<FastSequenceView {...props} phase="study" />);
    expect(screen.getByRole('list', { name: label })).toBeInTheDocument();
    view.unmount();
    render(<FastSequenceView {...props} phase="respond" />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText(/Hidden/)).toBeInTheDocument();
  });
});
