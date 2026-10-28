/**
 * Next-value inference for one feature of a row. A reading is accepted only with enough evidence:
 * a cycle of length p needs at least two full cycles shown, a constant step needs three values.
 * A row is unambiguous when all accepted readings agree on one next value.
 */
/** Smallest cycle length p (with two full cycles shown) that explains the values, or null. */
export function minimalPeriod<V>(values: readonly V[], same = (a: V, b: V) => a === b) {
  for (let p = 1; 2 * p <= values.length; p++) {
    if (values.every((v, i) => i < p || same(v, values[i - p] as V))) return p;
  }
  return null;
}

/** Constant difference of a numeric row (three values at least), or null. */
export function constantStep(values: readonly number[], modulo: number | null = null) {
  if (values.length < 3) return null;
  const norm = (d: number) => (modulo === null ? d : ((d % modulo) + modulo) % modulo);
  const d = norm((values[1] as number) - (values[0] as number));
  for (let i = 2; i < values.length; i++) {
    if (norm((values[i] as number) - (values[i - 1] as number)) !== d) return null;
  }
  return d;
}

/** Every distinct next value proposed by a cycle reading and (for numbers) a step reading. */
export function nextCandidates(values: readonly number[], modulo: number | null = null): number[] {
  const out = new Set<number>();
  const period = minimalPeriod(values);
  if (period !== null) out.add(values[values.length - period] as number);
  const d = constantStep(values, modulo);
  if (d !== null) {
    const next = (values.at(-1) as number) + d;
    out.add(modulo === null ? next : ((next % modulo) + modulo) % modulo);
  }
  return [...out];
}
