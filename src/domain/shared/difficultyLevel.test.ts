import {
  DIFFICULTY_LEVELS,
  isDifficultyLevel,
  parseDifficultyLevel,
  stepLevel,
  tierOf,
} from './difficultyLevel';

describe('DifficultyLevel', () => {
  it.each([1, 5, 10])('accepts %s', (value) => {
    expect(isDifficultyLevel(value)).toBe(true);
  });

  it.each([0, 11, -1, 5.5, Number.NaN, '5', null, undefined])('rejects %s', (value) => {
    expect(isDifficultyLevel(value)).toBe(false);
  });

  it('parses canonical strings from untrusted input', () => {
    expect(parseDifficultyLevel('7')).toEqual({ ok: true, value: 7 });
    expect(parseDifficultyLevel(10)).toEqual({ ok: true, value: 10 });
  });

  it.each(['', ' 7', '7a', '1e1', '11', '0', 'abc', {}])('fails to parse %j', (input) => {
    expect(parseDifficultyLevel(input)).toEqual({
      ok: false,
      error: { code: 'INVALID_LEVEL', input },
    });
  });

  it('maps every level to its tier', () => {
    expect(DIFFICULTY_LEVELS.map(tierOf)).toEqual([
      'fundamentals',
      'fundamentals',
      'fundamentals',
      'intermediate',
      'intermediate',
      'intermediate',
      'advanced',
      'advanced',
      'expert',
      'expert',
    ]);
  });

  it('steps and clamps to the valid range', () => {
    expect(stepLevel(5, 1)).toBe(6);
    expect(stepLevel(5, -2)).toBe(3);
    expect(stepLevel(10, 1)).toBe(10);
    expect(stepLevel(1, -1)).toBe(1);
    expect(stepLevel(3, 100)).toBe(10);
  });

  it('refuses fractional steps instead of rounding silently', () => {
    expect(() => stepLevel(3, 0.5)).toThrow(RangeError);
  });
});
