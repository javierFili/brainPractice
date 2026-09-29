import { deriveSeed, InvalidSeedError, MAX_SEED, parseSeed, toSeed } from './seed';

describe('seed', () => {
  it.each([0, 1, 12345, MAX_SEED])('accepts integer %s', (value) => {
    expect(parseSeed(value)).toEqual({ ok: true, value });
  });

  it('accepts canonical decimal strings (URL input)', () => {
    expect(parseSeed('0')).toEqual({ ok: true, value: 0 });
    expect(parseSeed('4294967295')).toEqual({ ok: true, value: MAX_SEED });
  });

  it.each([
    -1,
    1.5,
    MAX_SEED + 1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    '',
    ' 7',
    '1e3',
    '0x10',
    '007',
    '-1',
    '4294967296',
    null,
    undefined,
    {},
  ])('rejects %j instead of coercing it', (input) => {
    expect(parseSeed(input).ok).toBe(false);
    expect(() => toSeed(input)).toThrow(InvalidSeedError);
  });

  describe('deriveSeed', () => {
    const parent = toSeed(12345);

    it('is deterministic (golden values guard reproducibility of shared seeds)', () => {
      expect([0, 1, 2].map((i) => deriveSeed(parent, i))).toEqual([
        4067997445, 2268713484, 712539786,
      ]);
    });

    it('produces valid, collision-free child seeds for a long session', () => {
      const children = Array.from({ length: 1000 }, (_, i) => deriveSeed(parent, i));
      expect(new Set(children).size).toBe(1000);
      for (const child of children) expect(parseSeed(child).ok).toBe(true);
    });

    it('depends on the parent seed', () => {
      expect(deriveSeed(toSeed(1), 0)).not.toBe(deriveSeed(toSeed(2), 0));
    });

    it.each([-1, 1.5, Number.NaN])('rejects index %s', (index) => {
      expect(() => deriveSeed(parent, index)).toThrow(RangeError);
    });
  });
});
