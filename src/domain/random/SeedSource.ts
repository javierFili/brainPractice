import type { Seed } from './seed';

/** Supplies fresh session seeds (crypto in production, fixed in tests). */
export interface SeedSource {
  next(): Seed;
}
