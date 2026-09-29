/** Source of uniformly distributed numbers in [0, 1). Implementations must be deterministic when seeded. */
export interface RandomGenerator {
  next(): number;
}
