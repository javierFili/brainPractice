import { buildLevelTable } from '@/test/fixtures/fixtureGame';
import type { DifficultyProfile, LevelTable } from './difficultyProfile';
import { validateLevelTable } from './difficultyProfile';

const table = buildLevelTable<DifficultyProfile>(() => ({}));

describe('validateLevelTable', () => {
  it('accepts a coherent 1–10 table', () => {
    expect(validateLevelTable(table)).toEqual([]);
  });

  it('reports mismatched levels, tiers, objectives, counts and timing per level', () => {
    const broken: LevelTable = {
      ...table,
      1: { ...table[1], level: 2 },
      4: { ...table[4], tier: 'fundamentals' },
      9: { ...table[9], objective: '', challengeCount: 0 },
      10: {
        ...table[10],
        challengeCount: 2.5,
        timing: { studyMs: null, limitMs: 100, targetMs: 200 },
      },
    };
    expect(validateLevelTable(broken)).toEqual([
      'level 1: profile declares level 2',
      'level 4: tier must be "intermediate"',
      'level 9: objective is empty',
      'level 9: challengeCount must be a positive integer',
      'level 10: challengeCount must be a positive integer',
      'level 10: targetMs exceeds limitMs',
    ]);
  });
});
