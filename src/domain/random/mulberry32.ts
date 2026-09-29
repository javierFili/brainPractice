import type { RandomGenerator } from './RandomGenerator';
import type { Seed } from './seed';

/**
 * Mulberry32: small, fast 32-bit PRNG with good statistical quality for content generation.
 * The seed is scrambled before use so nearby seeds give independent streams. Not cryptographic. Changing this algorithm changes every seeded challenge — guarded by golden tests.
 */
export function mulberry32(seed: Seed): RandomGenerator {
  // Scramble the seed first (murmur3 finaliser): raw mulberry32 gives correlated first outputs for
  // nearby seeds (1, 2, 3… or evenly spaced ones), which skewed the first pick of generators.
  let state = seed >>> 0;
  state = Math.imul(state ^ (state >>> 16), 0x85ebca6b);
  state = Math.imul(state ^ (state >>> 13), 0xc2b2ae35);
  state = (state ^ (state >>> 16)) >>> 0;
  return {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}
