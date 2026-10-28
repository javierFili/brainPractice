# Patterns & Spatial Reasoning games

Category `patterns`, area `patterns`. Ten games in `src/games/patterns/<slug>/`, registered in
catalog order in `src/games/patterns/index.ts`. None of them needs programming knowledge.

Common to all ten: untimed (`limitMs: null`, `targetMs` only feeds the standard pace figure),
`feedback: 'explain'` with an explanation of the rule, 5–6 challenges per session, keyboard
`full`, `measures: ['accuracy']` (result = share of challenges solved), shape **and** colour on
every visual element, plus a spoken description of every grid, figure and option.

| #   | id                             | Name                         | Mechanic                                                                                                                                                                                                   | Format                                             | What the levels vary                                                                                                         | Status      |
| --- | ------------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | `visual-pattern-completion`    | Visual Pattern Completion    | A row of figures; choose the next one. Repeating blocks (AB, ABC, AABB, ABAC), shapes and colours on separate cycles, counts that grow or shrink, arrows that turn.                                        | single-choice, drawn options                       | Block length and inner repeats, start mid-block, number of independent features (1 → shape + colour + count), options 3 → 8  | implemented |
| 2   | `number-pattern-completion`    | Number Pattern Completion    | 2-D number layouts: 3×3 grids with row/column rules, sum pyramids, wheels (opposite segments), crosses (centre from the arms). Not linear sequences.                                                       | numeric                                            | Layout, rule family (sums → differences, steps, additive tables, products), pyramid size and blank bricks, gap position      | implemented |
| 3   | `shape-rotation`               | Shape Rotation               | A fully asymmetric polyomino; pick the copy that is only turned (90/180/270°), never flipped.                                                                                                              | single-choice, drawn options                       | Piece size 5 → 7 squares, mirror-image look-alikes (in pairs from L2), near pieces that differ by one square, options 3 → 8  | implemented |
| 4   | `matrix-reasoning`             | Matrix Reasoning             | 2×2 then 3×3 matrices of figures; per-feature rules (constant, by row, by column, latin square, count or turn progression); choose the missing cell.                                                       | single-choice, drawn options                       | Matrix size, number of ruled features (shape, colour, count, arrow direction), rule types, gap position, options 4 → 8       | implemented |
| 5   | `sequence-prediction`          | Sequence Prediction          | Frames of a small grid where marks move by a fixed step and/or arrows turn by a fixed step; choose the next frame.                                                                                         | single-choice, drawn options                       | Grid 3 → 5, straight → diagonal → 2-square steps, turning, wrap-around edges, one → two marks, options 3 → 8                 | implemented |
| 6   | `symmetry-recognition`         | Symmetry Recognition         | Classify a pattern's mirror lines (left–right / top–bottom / both / none), or complete the mirrored half by marking cells.                                                                                 | single-choice (classify) + multi-select (complete) | Grid size, near-symmetric decoys (2 → 1 cell off), tile kinds, vertical → horizontal → either axis, count announced → hidden | implemented |
| 7   | `spatial-transformation`       | Spatial Transformation       | Apply a stated move (quarter turn either way, half turn, flip left–right, flip upside down) to a pattern; from L7 two moves in a row.                                                                      | single-choice, drawn options                       | Grid 3×3 → 5×5, move pool, one → two moves, tile kinds, options 3 → 8 (all dihedral images)                                  | implemented |
| 8   | `rule-based-pattern-discovery` | Rule-Based Pattern Discovery | Input → output example grids; infer the hidden change (mirror, turn, slide with wrap, tiles changing kind or swapping, tiles falling/sliding, rows/columns filling) and choose the output for a new input. | single-choice, drawn options                       | Rule family, grid 3×3 → 5×5, tile kinds 1 → 3, examples 2 → 5, one → two chained changes, options 3 → 6                      | implemented |
| 9   | `grid-and-path-reasoning`      | Grid and Path Reasoning      | Mazes (turtle → star): shortest route length, which exit is reachable, which cell every shortest route crosses. BFS solver.                                                                                | numeric + single-choice                            | Maze size 5×5 → 9×9, wall density and detours, question type, number of exits                                                | implemented |
| 10  | `abstract-pattern-challenge`   | Abstract Pattern Challenge   | Several panels of figures share a hidden rule (colour, shape, contents, count, direction, mirror order) while other features vary as noise; pick the panel that breaks it.                                 | single-choice ("Panel 1…n", display order)         | Panels 4 → 6, figures per panel, rule families available, amount of noise                                                    | implemented |

## How correctness is guaranteed

- Every answer is computed by code, and an independent solver re-checks it in the tests across all
  ten levels and many seeds. Candidates that are ambiguous are rejected with `retryGeneration`:
  - 1, 5: each feature needs two full cycles shown (or three values for a constant step); every
    accepted reading of every feature must agree on one next figure/frame.
  - 2, 4, 8, 10: a rule library is searched exhaustively; all rules (or rule chains) consistent with
    what is shown must predict the same answer, and in 10 every library rule that singles out one
    panel must single out the same panel.
  - 3, 7: exact dihedral checks on asymmetric pieces/patterns (all eight images distinct).
  - 6: exact symmetry classification; completion halves are never their own mirror image.
  - 9: BFS from start and goal; "must pass" cells lie on every shortest route, distractor cells on
    none; exactly one exit is reachable.
- Distractors: attribute-based options (1, 4, 5) come from `shared/content/design.ts`
  (`balancedDesign`): each value used in a feature appears in the same number of options, so
  "pick the option most like the others" or "pick the most common value" is at chance. Tests use
  `src/test/guessability.ts` (centroid rate) for every choice game with structured options, and
  surface heuristics (most/fewest figures, colours, shapes) for 10. Answer positions are uniform.
- Generation averages under 2 ms per challenge for every game (tested against the 5 ms budget).

## Shared code

- `shared/content/` (pure): tile grids and their turns/flips plus a label codec, figures
  (shape, colour, count, direction) plus a label codec, `balancedDesign`, cycle/step inference,
  `orderedChoice`.
- `shared/ui/`: `TileGridFigure`, `FigureFace`/`Shape` (kit `Glyph` plus an arrow), `Missing`,
  and `renderPatternOption`/`describePatternOption`, which draw option labels as pictures and
  read tile grids aloud.
- `shared/testing.ts`: test-only helpers (`generateMany`, distances, `expectNoCentroidBias`,
  `expectFastGeneration`).

## Known limitations

- Spatial games (3, 6, 7, 8 and the mazes in 9) are described row by row for screen readers. That
  is complete but much harder to turn, fold or trace by ear than the picture; the games'
  `accessibilityNotes` say so.
- Option labels for grids use symbols (`■·● / ·◆·`); they are spoken through `describeOption`, but
  the written correct answer in feedback and results shows the symbol form.
- "Unambiguous" means among the game's own rule library. A player may find a different, unusual
  rule that also fits; the explanation always states the intended one.
- In Spatial Transformation the unchanged pattern can appear as an option (never correct).
- Symmetry Recognition, level 10 (8×6 grid, vertical line): the Check/Clear buttons sit under the
  editable half only, which looks slightly lopsided at 360 px.
- Results report accuracy only. Response times are recorded by the session as usual but the games
  are untimed, so speed is not presented as a result.
