import { toSeed, type SeedSource } from '@/domain/random';

export const cryptoSeedSource: SeedSource = {
  next: () => toSeed(crypto.getRandomValues(new Uint32Array(1))[0]),
};
