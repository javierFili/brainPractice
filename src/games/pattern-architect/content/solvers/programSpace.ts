/**
 * Exhaustive search over "hidden programs": every chain of up to `maxDepth` operations from a
 * catalogue. Shared by list transforms and tree restructurings.
 *
 * Programs are grouped by behaviour — the outputs they produce on every input of the challenge
 * (examples and question). Two programs with the same behaviour stay indistinguishable after any
 * further step, so keeping one representative per behaviour is exact, and turns tens of thousands
 * of programs into a few hundred.
 */
export interface ProgramSpace<V, O> {
  readonly operations: readonly O[];
  apply(operation: O, value: V): V;
  /** Canonical text of a value; equal keys mean equal values. */
  key(value: V): string;
}

export interface Behaviour<V, O> {
  /** A shortest program with this behaviour (breadth-first search finds short ones first). */
  readonly program: readonly O[];
  readonly outputs: readonly V[];
  readonly keys: readonly string[];
}

export function enumerateBehaviours<V, O>(
  space: ProgramSpace<V, O>,
  inputs: readonly V[],
  maxDepth: number,
): Behaviour<V, O>[] {
  const identity: Behaviour<V, O> = {
    program: [],
    outputs: inputs,
    keys: inputs.map((input) => space.key(input)),
  };
  const seen = new Map<string, Behaviour<V, O>>([[identity.keys.join('\n'), identity]]);
  let frontier = [identity];
  for (let depth = 1; depth <= maxDepth; depth++) {
    const next: Behaviour<V, O>[] = [];
    for (const behaviour of frontier) {
      for (const operation of space.operations) {
        const outputs = behaviour.outputs.map((value) => space.apply(operation, value));
        const keys = outputs.map((value) => space.key(value));
        const id = keys.join('\n');
        if (seen.has(id)) continue;
        const extended = { program: [...behaviour.program, operation], outputs, keys };
        seen.set(id, extended);
        next.push(extended);
      }
    }
    frontier = next;
  }
  return [...seen.values()];
}

/**
 * Same result as `enumerateBehaviours` restricted to what inference needs, much faster: the last
 * level (the largest one) is not stored in full — a program of `maxDepth` steps is kept only if it
 * reproduces `required` (the outputs of the first inputs, i.e. the examples always shown), checked
 * input by input so most candidates are dropped after one list. Every behaviour of fewer steps is
 * kept, so near-miss distractors can still be drawn from them.
 */
export function searchPrograms<V, O>(
  space: ProgramSpace<V, O>,
  inputs: readonly V[],
  required: readonly string[],
  maxDepth: number,
): Behaviour<V, O>[] {
  const shallow = enumerateBehaviours(space, inputs, maxDepth - 1);
  const seen = new Set(shallow.map((b) => b.keys.join('\n')));
  const deep: Behaviour<V, O>[] = [];
  for (const behaviour of shallow) {
    if (behaviour.program.length !== maxDepth - 1) continue;
    for (const operation of space.operations) {
      const outputs: V[] = [];
      const keys: string[] = [];
      let fits = true;
      for (const [i, value] of behaviour.outputs.entries()) {
        const output = space.apply(operation, value);
        const key = space.key(output);
        if (i < required.length && key !== required[i]) {
          fits = false;
          break;
        }
        outputs.push(output);
        keys.push(key);
      }
      const id = keys.join('\n');
      if (!fits || seen.has(id)) continue;
      seen.add(id);
      deep.push({ program: [...behaviour.program, operation], outputs, keys });
    }
  }
  return [...shallow, ...deep];
}

/** How many of the first `expected.length` inputs a behaviour gets wrong. */
export const mismatches = (behaviour: Behaviour<unknown, unknown>, expected: readonly string[]) =>
  expected.reduce((count, key, i) => (behaviour.keys[i] === key ? count : count + 1), 0);

export interface Inference<V, O> {
  /** Behaviours reproducing every example. */
  readonly consistent: readonly Behaviour<V, O>[];
  /** Distinct outputs the consistent behaviours give for the question, by key. */
  readonly predictions: ReadonlyMap<string, V>;
  /** Length of the shortest program that explains the examples. */
  readonly shortest: number;
}

/**
 * Infers the question output from examples. `expected[i]` is the key of the output shown for
 * input `i`; the question is the input at `questionIndex`.
 */
export function infer<V, O>(
  behaviours: readonly Behaviour<V, O>[],
  expected: readonly string[],
  questionIndex: number,
): Inference<V, O> {
  const consistent = behaviours.filter((b) => mismatches(b, expected) === 0);
  const predictions = new Map<string, V>();
  for (const b of consistent) {
    const key = b.keys[questionIndex] as string;
    if (!predictions.has(key)) predictions.set(key, b.outputs[questionIndex] as V);
  }
  const shortest = Math.min(...consistent.map((b) => b.program.length));
  return { consistent, predictions, shortest };
}

/** Runs a program step by step, returning every intermediate value (input first). */
export function trace<V, O>(space: ProgramSpace<V, O>, program: readonly O[], input: V): V[] {
  const values = [input];
  for (const operation of program) values.push(space.apply(operation, values.at(-1) as V));
  return values;
}

/** Every distinct reordering of a program (for "right steps, wrong order" distractors). */
export function reorderings<O>(program: readonly O[]): O[][] {
  if (program.length <= 1) return [];
  const result: O[][] = [];
  const permute = (prefix: O[], rest: O[]) => {
    if (rest.length === 0) {
      if (prefix.some((op, i) => op !== program[i])) result.push(prefix);
      return;
    }
    rest.forEach((op, i) => {
      permute([...prefix, op], [...rest.slice(0, i), ...rest.slice(i + 1)]);
    });
  };
  permute([], [...program]);
  return result;
}

/** The program with one step left out, for each step. */
export const withoutOneStep = <O>(program: readonly O[]): O[][] =>
  program.length <= 1
    ? []
    : program.map((_, i) => [...program.slice(0, i), ...program.slice(i + 1)]);
