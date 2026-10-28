import {
  describeGameContract,
  expectDistinctLevels,
  expectNonDecreasing,
} from '@/test/gameContract';
import {
  expectFastGeneration,
  expectNoCentroidBias,
  generateMany,
  optionLabels,
  solutionLabel,
} from '../shared/testing';
import { solveFrames, sequencePredictionGame } from './content/definition';
import { frameLabel, parseFrame } from './content/frames';
import { SEQUENCE_PREDICTION_LEVELS } from './content/levels';
import { sequencePredictionModule } from './index';

describeGameContract(sequencePredictionModule);

/** Features that differ between two frame labels: each mark's cell and direction. */
function frameDistance(a: string, b: string): number {
  const fa = parseFrame(a)?.frame;
  const fb = parseFrame(b)?.frame;
  if (!fa || !fb) throw new Error('frame labels expected');
  return fa.marks.reduce((sum, m, i) => {
    const o = fb.marks[i];
    if (!o) return sum + 2;
    return (
      sum +
      Number(m.row !== o.row || m.col !== o.col) +
      Number(m.figure.rotation !== o.figure.rotation)
    );
  }, 0);
}

describe('Sequence Prediction', () => {
  const all = generateMany(sequencePredictionGame);

  it('has exactly one option that continues the frames with constant steps', () => {
    for (const { challenge } of all) {
      const { frames, size, wrap } = challenge.content;
      const next = solveFrames(frames, size, wrap);
      if (next === null) throw new Error('frames are not determined');
      const expected = frameLabel(next, size);
      expect(solutionLabel(challenge)).toBe(expected);
      const labels = optionLabels(challenge);
      expect(labels.filter((l) => l === expected)).toHaveLength(1);
      for (const label of labels) {
        const parsed = parseFrame(label);
        expect(parsed).not.toBeNull();
        const cells = parsed?.frame.marks.map((m) => `${m.row}:${m.col}`) ?? [];
        expect(new Set(cells).size).toBe(cells.length);
        for (const m of parsed?.frame.marks ?? []) {
          expect(m.row).toBeLessThan(size);
          expect(m.col).toBeLessThan(size);
        }
      }
    }
  });

  it('does not reward picking the option most similar to the others', () => {
    expectNoCentroidBias(
      all.map((e) => e.challenge),
      frameDistance,
    );
  });

  it('raises the load across levels', () => {
    expectDistinctLevels(SEQUENCE_PREDICTION_LEVELS);
    expectNonDecreasing(SEQUENCE_PREDICTION_LEVELS, (p) => p.options, 'options');
    expectNonDecreasing(SEQUENCE_PREDICTION_LEVELS, (p) => p.timing.targetMs, 'target time');
  });

  it('generates quickly', () => {
    expectFastGeneration(sequencePredictionGame);
  });
});
