import type { RandomGenerator } from './RandomGenerator';
import type { Seed } from './seed';

/**
 * Mulberry32: small, fast 32-bit PRNG with good statistical quality for content generation.
 * Not cryptographic. Changing this algorithm changes every seeded challenge — guarded by golden tests.
 */
export function mulberry32(seed: Seed): RandomGenerator {
  let state = seed >>> 0;
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
