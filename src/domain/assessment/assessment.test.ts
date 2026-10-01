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
  const entry = (i: number, performanceIndex: number, attempted?: number) => {
    const step = steps[i] as (typeof steps)[number];
    const total = step.challengeCount;
    const faced = attempted ?? total;
    return {
      step,
      result: resultFixture({
        performanceIndex,
        metrics: { ...resultFixture().metrics, total, attempted: faced, skipped: total - faced },
      }),
    };
  };

  it('weights harder levels more within an area and reports the precision', () => {
    // m(2) = 1.25, m(8) = 2.75 → (1.25·100 + 2.75·40) / 4 = 58.75
    const result = scoreAssessment(definition, [entry(0, 100), entry(1, 40), entry(2, 90)], 0, 10);
    expect(result.profile.logic).toEqual({
      value: 59,
      band: 'solid',
      sampleSize: 4,
      items: 4,
      margin: 49,
    });
    expect(result.profile.memory).toMatchObject({ value: 90, sampleSize: 3, items: 3 });
    expect(result.profile.overall).toMatchObject({ value: 75, sampleSize: 7, items: 7 });
    expect(result.profile.overall.margin).toBe(37);
    expect(result.profile.speed).toBeNull();
  });

  it('counts skipped challenges as unsolved, so skipping never raises the score', () => {
    const answered = scoreAssessment(definition, [entry(0, 100), entry(1, 0), entry(2, 90)], 0, 1);
    // Skipping the hard round instead of failing it: PI is computed over 0 attempts → credit 0.
    const skipped = scoreAssessment(
      definition,
      [entry(0, 100), entry(1, 0, 0), entry(2, 90)],
      0,
      1,
    );
    // Skipping half of the hard round after answering one correctly: credit is halved.
    const half = scoreAssessment(definition, [entry(0, 100), entry(1, 100, 1), entry(2, 90)], 0, 1);
    expect(skipped.profile.logic?.value).toBe(answered.profile.logic?.value);
    expect(skipped.profile.logic?.sampleSize).toBe(2);
    expect(half.profile.logic?.value).toBe(Math.round((1.25 * 100 + 2.75 * 50) / 4));
  });

  it('scores an area skipped entirely as 0 instead of dropping it from the index', () => {
    const result = scoreAssessment(definition, [entry(0, 80), entry(1, 80), entry(2, 0, 0)], 0, 10);
    expect(result.profile.memory).toMatchObject({ value: 0, sampleSize: 0, items: 3 });
    expect(result.profile.overall.value).toBe(40);
  });

  it('scores an empty assessment as 0 with no evidence', () => {
    expect(scoreAssessment(definition, [], 0, 0).profile.overall).toEqual({
      value: 0,
      band: 'developing',
      sampleSize: 0,
      items: 0,
      margin: 100,
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
