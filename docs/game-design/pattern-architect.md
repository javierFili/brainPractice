# Pattern Architect

**Area:** Patterns · **Id:** `pattern-architect` · **Source:** `src/games/pattern-architect/`

Find the rule behind what you see, then apply it to a new case. The game trains the step every
programmer makes before writing code: looking at examples, separating what varies from what stays
fixed, and naming the transformation that connects inputs to outputs.

Numbers stay small (sequence terms ≤ 250, list items are digits 0–9, grids hold at most six
symbols per cell). Difficulty comes from **composition** (one rule → three chained operations),
**abstraction** (from visible regularities to hidden programs and structure without names) and
**less evidence** (the fewest examples that still force the answer).

## Programming-thinking skills trained

| Skill                                 | Where it shows up                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Pattern recognition                   | Every kind: find a regularity that explains _all_ the evidence, not just the last item.          |
| Abstraction                           | Hidden programs, tree analogies and graph matching: reason about a transformation or a shape.    |
| Decomposition                         | Grids (shapes and counts follow separate rules), multi-step programs (what did each step do?).   |
| Algorithmic thinking                  | Hidden programs are pipelines of list operations — the same thinking as chaining `map`/`filter`. |
| Generalisation / debugging hypotheses | Near-miss distractors: a rule that fits all examples but one must be rejected.                   |

No language or named algorithm is assumed. Operations are described in plain words
("move the first item to the end"), trees are written `a(b, c)` = "a contains b and c, in that
order", and graphs as "a → b, c" = "a points to b and c".

## Challenge kinds

All kinds are answered with **single choice** (1 correct option + 3 distractors). Every generator
is quality-gated with `retryGeneration`: a candidate that is ambiguous, trivial or unreadable is
rejected and regenerated from the same seeded stream.

### `number-sequence` — levels 1–6

- **Goal:** give the next term. Example: `4, 8, 14, 22, 32, 44, 58, ?` → **74** (the step grows
  by 2: +4, +6, +8, …).
- **Rule catalogue** (`SequenceRule`): constant step, alternating steps, growing step (constant
  second difference), multiply, two interleaved sequences, a cycle of three steps, multiply-then-add,
  sum of the previous two, alternating multiply/add.
- **Uniqueness:** each family's parameters are forced by the first terms, so the solver fits every
  family (with _any_ integer parameters, far beyond what the generator uses), keeps those that
  reproduce every shown term, and requires all of them to predict the same next term. Tests
  re-check this with an independent brute force over ~18 000 bounded parameter combinations.
  Sequences where a term repeats its predecessor (a "stall") are rejected.
- **Distractors:** continuations produced by plausible misreadings: repeating only the last step
  (the classic first-difference trap), extrapolating the change of the step, assuming alternating
  or three-cycle steps, continuing the wrong one of two interleaved sequences, summing the last two,
  a constant ratio, and one term too far.

### `symbol-grid` — levels 1–6

- **Goal:** fill the missing cell of a 3×3 (4×4 from level 4) grid. A cell is a shape repeated
  _count_ times, e.g. `▲▲▲` (3 triangles). Shapes and counts follow **independent** rules.
- **Rules** (`GridRule`): constant, by row, by column, each row = the row above shifted left/right
  (a Latin square), counts stepping ±1 along rows/columns, the last count of a row/column = sum of
  the others.
- **Uniqueness:** for each attribute the solver tries a broader hypothesis set than the generator
  uses (it adds "every row holds the same set of values" and per-row progressions) and requires all
  hypotheses that fit the eight/fifteen visible cells to agree. Tests re-check independently by
  trying _every_ possible value for the gap (5 shapes × counts 1–9) against whole-grid rules and
  asserting exactly one completion survives — and that exactly one option is that completion.
- **Distractors:** predictions of hypotheses that do **not** fit (copying the column instead of the
  row, shifting the wrong way, a sum read as a progression), a count off by one, then other visible
  values — first changing one attribute (subtle), then both.

### `transform-inference` — levels 4–10

- **Goal:** a hidden program of 1–3 steps turns each input list into its output; give the output
  for a new input. Example (depth 2): `[9, 2, 6, 7, 4] → [5, 8, 7, 3, 10]`,
  `[4, 1, 4, 2] → [3, 5, 2, 5]`; new input `[7, 1, 7, 4]` → **`[5, 8, 2, 8]`** (reverse, then add 1).
- **Uniqueness:** the generator searches **the whole catalogue** (19 operations, not just the
  level's subset) up to the level's depth. Programs are grouped by behaviour on all inputs (exact
  pruning: identical behaviour stays identical after any further step). Examples are added one at a
  time (minimum 2, maximum per level) until every consistent program predicts the same output; if
  the cap is reached first, the candidate is rejected. The examples must also **need** the full
  depth: if a shorter program explains them, more examples are added or the candidate is rejected.
  Every step must visibly change the new input, and programs cannot repeat a step back to back or
  use only one kind of change (order / values / selection). Tests re-check with a naive enumeration
  of all 7 240 programs of ≤ 3 steps, without pruning.
- **Distractors:** the right steps in the wrong order, the program with a step forgotten, programs
  that fit every example **but one** (near misses), a look-alike step swapped in (rotate left ↔
  right, keep even ↔ odd, add 1 ↔ add 2 …), and as a last resort a single plausible step.
- The UI shows the full step vocabulary ("Possible steps") so the rule space is explicit.

### `structure-match` — levels 7–10

- **Goal:** which of four graphs has the same connection structure as the reference? Only the
  names differ (reference nodes `a–g`, candidates `1–7`). Graphs are small (5–7 nodes), acyclic
  and connected, like module dependencies or service calls.
- **Uniqueness:** decoys are mutations of the reference that are verified **not** isomorphic to
  it and not isomorphic to each other (backtracking isomorphism restricted to nodes with equal
  arrow counts). Tests re-check with a brute-force canonical form over all node permutations.
- **Distractors:** levels 7–8 move one end of one arrow (`rewire`), so some node's arrow count
  changes — a careful count exposes it. Levels 9–10 swap the targets of two arrows
  (`degree-preserving`): every node keeps its incoming/outgoing counts and only the wiring differs,
  so the player must follow connections, not count them.
- **Explanation:** gives the renaming that maps the reference onto the answer and, per decoy, a
  checkable reason (a node with an arrow profile the reference lacks, or a node whose targets
  differ).

### `tree-analogy` — levels 7–10

- **Goal:** `A → A′` (and sometimes `B → B′`) as `C → ?`. Trees are ordered, ≤ 7 items, like a
  folder listing or a component tree. Example: `h(i, e(r(j))) → h(j, r, e, i)`; new tree
  `z(y, q(s), b)` → **`z(b, s, q, y)`** (flatten, then mirror).
- **Operations** (`TreeOp`): mirror the whole tree, reverse only the top level, move the first
  top-level item to the end, remove every leaf, flatten into the root (reading order), sort children
  alphabetically. Levels 9–10 compose two of them.
- **Uniqueness / distractors:** same machinery as hidden programs (`programSpace.ts`): all
  restructurings up to the depth that fit the example pairs must agree; distractors are wrong
  orders, a missing step, look-alike operations, near misses and single operations. Each example
  uses different letters, so only structure carries over.

## Operation catalogue (hidden programs)

| Operation         | Plain words                                       | Kind      |
| ----------------- | ------------------------------------------------- | --------- |
| `reverse`         | reverse the list                                  | order     |
| `sort-ascending`  | sort from smallest to largest                     | order     |
| `sort-descending` | sort from largest to smallest                     | order     |
| `rotate-left`     | move the first item to the end                    | order     |
| `rotate-right`    | move the last item to the front                   | order     |
| `swap-pairs`      | swap each neighbouring pair (1st↔2nd, 3rd↔4th, …) | order     |
| `add` 1/2/3       | add k to every item                               | values    |
| `double`          | double every item                                 | values    |
| `running-total`   | replace each item by the total so far             | values    |
| `drop-first`      | remove the first item                             | selection |
| `drop-last`       | remove the last item                              | selection |
| `take-first` 2/3  | keep only the first n items                       | selection |
| `keep-even`       | keep only the even numbers                        | selection |
| `keep-odd`        | keep only the odd numbers                         | selection |
| `remove-repeats`  | remove repeated values (keep the first of each)   | selection |
| `duplicate-each`  | write every item twice                            | selection |

Levels 4–5 and 8 generate from a basic set whose effect is visible on a single example (reverse,
sort ascending, both rotations, drop first/last, add, double, keep even/odd); levels 6–7 and 9–10
add the data-dependent ones (`sort-descending`, `duplicate-each`, `take-first`,
`swap-pairs`, `remove-repeats`, `running-total`). Uniqueness is always checked against all of them.

## Levels

Profile fields (`PatternProfile`): `abstractionLevel` (1–5), `complexity` (most rules composed in
one challenge), `distractors` (3 everywhere), and per-kind parameters (`sequenceLength`, grid size,
program `depth`/`elementCount`/`maxExamples`, graph `elementCount`/`arrowCount`, tree `depth`).

| Level | Tier         | Objective                                                       | Time limit / target | Abstraction | Composition depth            | Complexity (content)                                                         | New at this level                                         |
| ----- | ------------ | --------------------------------------------------------------- | ------------------- | ----------- | ---------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1     | Fundamentals | Spot one regularity: a constant step, or one changing attribute | 60 s / 20 s         | 1           | 1 rule                       | 5 terms (constant / alternating steps); 3×3 grid, one attribute varies       | Sequences, grids                                          |
| 2     | Fundamentals | Changing steps; two attributes with separate rules              | 75 s / 25 s         | 1           | 2 rules (grid)               | 5 terms (+ growing step, multiply); shapes may shift like a Latin square     | Second differences, two-attribute grids                   |
| 3     | Fundamentals | Interleaved sequences; arithmetic counts                        | 90 s / 30 s         | 2           | 2 rules                      | 6 terms (+ interleaved); counts step ±1 or sum along a row/column            | Two sequences at once, sums/progressions inside a grid    |
| 4     | Intermediate | Infer a one-step hidden program from examples                   | 90 s / 35 s         | 2           | 1 step (programs), 2 (grids) | 7 terms (+ step cycles, multiply-add); 4×4 grids; lists of ~4, ≤ 3 examples  | `transform-inference`, 4×4 grids                          |
| 5     | Intermediate | Two chained steps: separate what each contributes               | 120 s / 45 s        | 3           | 2 steps                      | 7 terms (+ sum of previous two, alternating ×/+); ≤ 4 examples               | Composition, order of steps matters                       |
| 6     | Intermediate | Data-dependent steps with fewer examples                        | 120 s / 50 s        | 3           | 2 steps                      | Lists of ~5, full vocabulary, ≤ 3 examples; grids only arithmetic counts     | Repeats, pairs, running totals                            |
| 7     | Advanced     | Structure over content: match graphs, restructure trees         | 150 s / 60 s        | 4           | 2 steps / 1 tree op          | Graphs 5 nodes / 5 arrows (rewired decoys); trees ≤ 6 items, ≤ 2 examples    | `structure-match`, `tree-analogy`; sequences/grids retire |
| 8     | Advanced     | Three-step programs, bigger graphs, tree rules from one example | 180 s / 75 s        | 4           | 3 steps / 1 tree op          | Basic vocabulary, ≤ 4 examples; graphs 6 / 7; trees ≤ 7 items, 1 example     | Three-step pipelines                                      |
| 9     | Expert       | Look-alike graphs; two-step tree rules                          | 210 s / 90 s        | 5           | 3 steps / 2 tree ops         | Full vocabulary, ≤ 4 examples; graphs 6 / 7 with degree-preserving decoys    | Decoys with identical arrow counts; composed tree rules   |
| 10    | Expert       | Minimal evidence everywhere                                     | 240 s / 100 s       | 5           | 3 steps / 2 tree ops         | Full vocabulary, ≤ 3 examples; graphs 7 / 9 degree-preserving; trees 7 items | Fewest clues, largest structures                          |

Invariants checked by tests (`content/__tests__/`):

- `validateLevelTable` is clean; abstraction, complexity, program/tree depth, graph size and time
  budgets never decrease; program depth ≤ `complexity`; kinds appear only at their levels;
  degree-preserving decoys only at 9–10.
- Over 30 seeds × 10 levels: deterministic per seed; the solution is accepted by `evaluateAnswer`;
  options are distinct and number `distractors + 1`; the explanation contains the answer; the
  answer is uniquely determined by an **independent** solver for every kind (brute-force
  sequences, all grid completions, unpruned program enumeration, permutation canonical forms), and
  the examples of hidden programs need the full stated depth.
- Generation averages well under 20 ms per challenge at level 10 (≈ 4 ms measured).
