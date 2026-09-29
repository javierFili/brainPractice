import { mulberry32 } from './mulberry32';
import type { RandomGenerator } from './RandomGenerator';
import { chance, pick, randomInt, sample, shuffle } from './sampling';
import { toSeed } from './seed';

const seeded = (seed = 42) => mulberry32(toSeed(seed));
const constant = (value: number): RandomGenerator => ({ next: () => value });

describe('mulberry32', () => {
  it('reproduces the same stream for the same seed (golden values)', () => {
    const random = seeded(12345);
    expect([random.next(), random.next(), random.next()]).toEqual([
      0.6931933513842523, 0.8536368538625538, 0.06626646220684052,
    ]);
  });

  it('produces different streams for different seeds', () => {
    expect(seeded(1).next()).not.toBe(seeded(2).next());
  });

  it('stays in [0, 1) and is roughly uniform', () => {
    const random = seeded(7);
    const values = Array.from({ length: 20_000 }, () => random.next());
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    expect(mean).toBeGreaterThan(0.49);
    expect(mean).toBeLessThan(0.51);
  });

  it('gives independent first outputs for nearby and evenly spaced seeds', () => {
    // Guards the seed scrambling: without it, the first draw of consecutive seeds is correlated.
    for (const seedOf of [(i: number) => i, (i: number) => i * 7919 + 1]) {
      const below = Array.from({ length: 400 }, (_, i) => seeded(seedOf(i)).next()).filter(
        (v) => v < 0.5,
      ).length;
      expect(below).toBeGreaterThan(160);
      expect(below).toBeLessThan(240);
    }
  });

  it('works with seed 0', () => {
    expect(seeded(0).next()).toBeGreaterThanOrEqual(0);
  });
});

describe('sampling', () => {
  it('randomInt covers both inclusive bounds', () => {
    expect(randomInt(constant(0), 3, 8)).toBe(3);
    expect(randomInt(constant(0.999999), 3, 8)).toBe(8);
    expect(randomInt(seeded(), 4, 4)).toBe(4);
  });

  it.each([
    [5, 4],
    [1.5, 3],
    [0, Number.NaN],
  ])('randomInt rejects range [%s, %s]', (min, max) => {
    expect(() => randomInt(seeded(), min, max)).toThrow(RangeError);
  });

  it.each([1, -0.1, Number.NaN])('rejects a faulty generator returning %s', (value) => {
    expect(() => randomInt(constant(value), 0, 3)).toThrow(RangeError);
  });

  it('chance honours the probability extremes and validates it', () => {
    expect(chance(seeded(), 0)).toBe(false);
    expect(chance(seeded(), 1)).toBe(true);
    expect(() => chance(seeded(), 1.2)).toThrow(RangeError);
  });

  it('pick returns an element and rejects empty input', () => {
    expect(['a', 'b', 'c']).toContain(pick(seeded(), ['a', 'b', 'c']));
    expect(() => pick(seeded(), [])).toThrow(RangeError);
  });

  it('shuffle returns a deterministic permutation without mutating the input', () => {
    const input = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);
    const result = shuffle(seeded(), input);
    expect([...result].sort((a, b) => a - b)).toEqual([...input]);
    expect(shuffle(seeded(), input)).toEqual(result);
    expect(shuffle(seeded(), [])).toEqual([]);
  });

  it('sample returns distinct elements and validates the count', () => {
    const picked = sample(seeded(), ['a', 'b', 'c', 'd'], 3);
    expect(new Set(picked).size).toBe(3);
    expect(sample(seeded(), ['a'], 0)).toEqual([]);
    expect(() => sample(seeded(), ['a'], 2)).toThrow(RangeError);
    expect(() => sample(seeded(), ['a'], -1)).toThrow(RangeError);
  });
});
