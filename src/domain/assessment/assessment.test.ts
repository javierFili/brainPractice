import { resultFixture } from '@/test/fixtures/results';
import {
  bandOf,
  InvalidAssessmentError,
  planAssessment,
  scoreAssessment,
  type AssessmentDefinition,
} from './assessment';

const definition: AssessmentDefinition = {
  id: 'test',
  name: 'Test',
  sections: [
    { area: 'logic', gameId: 'fixture-max', levels: [2, 8], challengesPerLevel: 2 },
    { area: 'memory', gameId: 'fixture-mem', levels: [5], challengesPerLevel: 3 },
  ],
};

describe('planAssessment', () => {
  it('expands sections into ordered steps', () => {
    expect(planAssessment(definition)).toEqual([
      { index: 0, area: 'logic', gameId: 'fixture-max', level: 2, challengeCount: 2 },
      { index: 1, area: 'logic', gameId: 'fixture-max', level: 8, challengeCount: 2 },
      { index: 2, area: 'memory', gameId: 'fixture-mem', level: 5, challengeCount: 3 },
    ]);
  });

  it.each<[string, AssessmentDefinition]>([
    ['no sections', { ...definition, sections: [] }],
    [
      'no levels',
      {
        ...definition,
        sections: [{ area: 'logic', gameId: 'g', levels: [], challengesPerLevel: 1 }],
      },
    ],
    [
      'zero challenges',
      {
        ...definition,
        sections: [{ area: 'logic', gameId: 'g', levels: [1], challengesPerLevel: 0 }],
      },
    ],
  ])('rejects %s', (_, invalid) => {
    expect(() => planAssessment(invalid)).toThrow(InvalidAssessmentError);
  });
});

describe('scoreAssessment', () => {
  const steps = planAssessment(definition);
  const entry = (i: number, performanceIndex: number, attempted = 2) => ({
    step: steps[i] as (typeof steps)[number],
    result: resultFixture({ performanceIndex, metrics: { ...resultFixture().metrics, attempted } }),
  });

  it('weights harder levels more within an area', () => {
    // m(2) = 1.25, m(8) = 2.75 → (1.25·100 + 2.75·40) / 4 = 58.75
    const result = scoreAssessment(
      definition,
      [entry(0, 100), entry(1, 40), entry(2, 90, 3)],
      0,
      10,
    );
    expect(result.profile.logic).toEqual({ value: 59, band: 'solid', sampleSize: 4 });
    expect(result.profile.memory).toEqual({ value: 90, band: 'exceptional', sampleSize: 3 });
    expect(result.profile.overall).toEqual({ value: 75, band: 'strong', sampleSize: 7 });
    expect(result.profile.speed).toBeNull();
  });

  it('reports areas without attempts as unmeasured, not as zero', () => {
    const result = scoreAssessment(definition, [entry(0, 80), entry(2, 0, 0)], 0, 10);
    expect(result.profile.memory).toBeNull();
    expect(result.profile.overall.value).toBe(80);
  });

  it('scores an empty assessment as 0 with no evidence', () => {
    expect(scoreAssessment(definition, [], 0, 0).profile.overall).toEqual({
      value: 0,
      band: 'developing',
      sampleSize: 0,
    });
  });

  it('maps values to bands at the thresholds', () => {
    expect([0, 39, 40, 59, 60, 79, 80, 100].map(bandOf)).toEqual([
      'developing',
      'developing',
      'solid',
      'solid',
      'strong',
      'strong',
      'exceptional',
      'exceptional',
    ]);
  });
});
