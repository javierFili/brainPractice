import { toSeed, type Seed, type SeedSource } from '@/domain/random';

/** Returns the given seeds in order, then repeats the last one. */
export class FixedSeedSource implements SeedSource {
  private index = 0;
  private readonly seeds: readonly Seed[];

  constructor(...seeds: number[]) {
    this.seeds = (seeds.length > 0 ? seeds : [1]).map(toSeed);
  }

  next(): Seed {
    const seed = this.seeds[Math.min(this.index, this.seeds.length - 1)] as Seed;
    this.index += 1;
    return seed;
  }
}
