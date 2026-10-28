/** Every permutation of `items` (Heap's algorithm). 6 items → 720 permutations. */
export function permutations<T>(items: readonly T[]): T[][] {
  const result: T[][] = [];
  const current = [...items];
  const c = new Array<number>(current.length).fill(0);
  result.push([...current]);
  let i = 0;
  while (i < current.length) {
    const ci = c[i] as number;
    if (ci < i) {
      const j = i % 2 === 0 ? 0 : ci;
      [current[i], current[j]] = [current[j] as T, current[i] as T];
      result.push([...current]);
      c[i] = ci + 1;
      i = 0;
    } else {
      c[i] = 0;
      i += 1;
    }
  }
  return result;
}

const permutationCache = new Map<number, readonly (readonly number[])[]>();

/** Permutations of 0..n-1, computed once per n (pure, deterministic cache). */
export function indexPermutations(n: number): readonly (readonly number[])[] {
  let cached = permutationCache.get(n);
  if (!cached) {
    cached = permutations(Array.from({ length: n }, (_, i) => i));
    permutationCache.set(n, cached);
  }
  return cached;
}

/** Every true/false assignment of `n` variables, as arrays of booleans. */
export function booleanAssignments(n: number): boolean[][] {
  return Array.from({ length: 2 ** n }, (_, mask) =>
    Array.from({ length: n }, (_, bit) => ((mask >> bit) & 1) === 1),
  );
}
