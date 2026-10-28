# Catálogo de juegos

> Generado a partir del registro real (`src/games/registry.ts`). **60 juegos implementados, 0 parciales, 0 pendientes**:
> cada uno se inicia, explica sus reglas, genera desafíos válidos en sus 10 niveles, recibe y evalúa respuestas, da feedback,
> registra métricas, termina la sesión y muestra resultados. Lo garantiza `describeGameContract` más los tests de corrección
> de cada juego (oráculo independiente, unicidad de la solución, progresión de niveles, interacción).

| Categoría                        | Implementados | Parciales | Pendientes | Detalle                                           |
| -------------------------------- | ------------- | --------- | ---------- | ------------------------------------------------- |
| Memoria                          | 10            | 0         | 0          | [docs/games/memory.md](games/memory.md)           |
| Lógica                           | 10            | 0         | 0          | [docs/games/logic.md](games/logic.md)             |
| Velocidad mental                 | 10            | 0         | 0          | [docs/games/speed.md](games/speed.md)             |
| Atención y concentración         | 10            | 0         | 0          | [docs/games/attention.md](games/attention.md)     |
| Patrones y razonamiento espacial | 10            | 0         | 0          | [docs/games/patterns.md](games/patterns.md)       |
| Programación                     | 10            | 0         | 0          | [docs/games/programming.md](games/programming.md) |

## Memoria

| #   | id                      | Juego                 | Mecánica                                               | Interacción | Métricas                  | Sin límite de tiempo | Estado          |
| --- | ----------------------- | --------------------- | ------------------------------------------------------ | ----------- | ------------------------- | -------------------- | --------------- |
| 1   | `memory-cards`          | Memory Cards          | Turn two cards, find the twins.                        | pairs       | accuracy, completion-time | sí                   | ✅ implementado |
| 2   | `sequence-recall`       | Sequence Recall       | Watch the sequence, then rebuild it.                   | sequence    | accuracy, streak          | sí                   | ✅ implementado |
| 3   | `position-memory`       | Position Memory       | Where did the lights appear?                           | grid        | accuracy                  | sí                   | ✅ implementado |
| 4   | `object-recall`         | Object Recall         | Which of these did you see?                            | grid        | accuracy                  | sí                   | ✅ implementado |
| 5   | `number-recall`         | Number Recall         | Codes, phone numbers, tickets: hold them for a moment. | mixed       | accuracy                  | sí                   | ✅ implementado |
| 6   | `word-recall`           | Word Recall           | Read a list of words, then find them again.            | mixed       | accuracy                  | sí                   | ✅ implementado |
| 7   | `visual-changes`        | Visual Changes        | Something is different. What?                          | grid        | accuracy                  | sí                   | ✅ implementado |
| 8   | `association-memory`    | Association Memory    | What went with what?                                   | choice      | accuracy                  | sí                   | ✅ implementado |
| 9   | `working-memory-grid`   | Working Memory Grid   | Keep track of the latest lights.                       | grid        | accuracy                  | sí                   | ✅ implementado |
| 10  | `dual-memory-challenge` | Dual Memory Challenge | What, where and when — all at once.                    | mixed       | accuracy                  | sí                   | ✅ implementado |

## Lógica

| #   | id                      | Juego                      | Mecánica                                            | Interacción | Métricas | Sin límite de tiempo | Estado          |
| --- | ----------------------- | -------------------------- | --------------------------------------------------- | ----------- | -------- | -------------------- | --------------- |
| 1   | `logical-deduction`     | Logical Deduction          | Use the clues to work out who has what.             | choice      | accuracy | sí                   | ✅ implementado |
| 2   | `number-sequences`      | Number Sequences           | Find the rule, then the number.                     | numeric     | accuracy | sí                   | ✅ implementado |
| 3   | `rule-discovery`        | Rule Discovery             | Spot the hidden rule from examples.                 | choice      | accuracy | sí                   | ✅ implementado |
| 4   | `conditional-reasoning` | Conditional Reasoning      | If this, then that — what really follows?           | choice      | accuracy | sí                   | ✅ implementado |
| 5   | `constraint-solver`     | Constraint Solver          | Fill the grid in your head and find one number.     | numeric     | accuracy | sí                   | ✅ implementado |
| 6   | `sequence-ordering`     | Sequence Ordering          | Put everyone in the right order.                    | ordering    | accuracy | sí                   | ✅ implementado |
| 7   | `truth-and-falsehood`   | Truth and Falsehood        | Some always tell the truth, some always lie.        | mixed       | accuracy | sí                   | ✅ implementado |
| 8   | `strategy-puzzle`       | Strategy Puzzle            | Plan ahead: find the best move or the shortest way. | mixed       | accuracy | sí                   | ✅ implementado |
| 9   | `algorithmic-reasoning` | Algorithmic Reasoning      | Follow the robot’s instructions step by step.       | grid        | accuracy | sí                   | ✅ implementado |
| 10  | `multi-step-logic`      | Multi-Step Logic Challenge | Chain several facts together to reach the answer.   | mixed       | accuracy | sí                   | ✅ implementado |

## Velocidad mental

| #   | id                          | Juego                             | Mecánica                                           | Interacción | Métricas                | Sin límite de tiempo          | Estado          |
| --- | --------------------------- | --------------------------------- | -------------------------------------------------- | ----------- | ----------------------- | ----------------------------- | --------------- |
| 1   | `reaction-test`             | Reaction Test                     | Wait for it… now!                                  | tap         | accuracy, reaction-time | no (la velocidad es la tarea) | ✅ implementado |
| 2   | `rapid-symbol-matching`     | Rapid Symbol Matching             | Same or different? Look closely, answer fast.      | choice      | accuracy, response-time | sí                            | ✅ implementado |
| 3   | `number-comparison`         | Number Comparison                 | Which one is bigger? Quick!                        | choice      | accuracy, response-time | sí                            | ✅ implementado |
| 4   | `visual-search-sprint`      | Visual Search Sprint              | One target, many distractors — find it fast.       | grid        | accuracy, response-time | sí                            | ✅ implementado |
| 5   | `rapid-classification`      | Rapid Classification              | Fruit or animal? Decide fast.                      | choice      | accuracy, response-time | sí                            | ✅ implementado |
| 6   | `color-and-shape-decisions` | Color and Shape Decisions         | Colour or shape? The cue decides.                  | choice      | accuracy, response-time | sí                            | ✅ implementado |
| 7   | `fast-sequence-recognition` | Fast Sequence Recognition         | One glimpse — which one was it?                    | choice      | accuracy, response-time | sí                            | ✅ implementado |
| 8   | `mental-arithmetic-sprint`  | Mental Arithmetic Sprint          | Quick sums, checked or solved.                     | mixed       | accuracy, response-time | sí                            | ✅ implementado |
| 9   | `code-scan-sprint`          | Code Scan                         | Read a listing at a glance and point at the line.  | choice      | accuracy, response-time | sí                            | ✅ implementado |
| 10  | `multi-choice-processing`   | Multi-Choice Processing Challenge | Ignore the crowd: which way does the centre point? | choice      | accuracy, response-time | sí                            | ✅ implementado |

## Atención y concentración

| #   | id                              | Juego                         | Mecánica                                  | Interacción | Métricas | Sin límite de tiempo | Estado          |
| --- | ------------------------------- | ----------------------------- | ----------------------------------------- | ----------- | -------- | -------------------- | --------------- |
| 1   | `odd-one-out`                   | Odd One Out                   | All the same… except one.                 | grid        | accuracy | sí                   | ✅ implementado |
| 2   | `visual-difference`             | Visual Difference             | Spot the differences, one cell at a time. | grid        | accuracy | sí                   | ✅ implementado |
| 3   | `target-tracking`               | Target Tracking               | Keep your eyes on the card.               | grid        | accuracy | sí                   | ✅ implementado |
| 4   | `distractor-filtering`          | Distractor Filtering          | Only the blue triangles. Ignore the rest. | grid        | accuracy | sí                   | ✅ implementado |
| 5   | `change-detection`              | Change Detection              | Same scene… or not?                       | choice      | accuracy | sí                   | ✅ implementado |
| 6   | `symbol-counting`               | Symbol Counting               | How many are there — exactly?             | numeric     | accuracy | sí                   | ✅ implementado |
| 7   | `error-detection`               | Error Detection               | Proofread: exactly one thing is wrong.    | mixed       | accuracy | sí                   | ✅ implementado |
| 8   | `sustained-attention-challenge` | Sustained Attention Challenge | Stay with the stream.                     | tap         | accuracy | sí                   | ✅ implementado |
| 9   | `dual-task-attention`           | Dual-Task Attention           | Two counts at once.                       | choice      | accuracy | sí                   | ✅ implementado |
| 10  | `complex-visual-inspection`     | Complex Visual Inspection     | Three features must all match.            | grid        | accuracy | sí                   | ✅ implementado |

## Patrones y razonamiento espacial

| #   | id                             | Juego                        | Mecánica                                                        | Interacción | Métricas | Sin límite de tiempo | Estado          |
| --- | ------------------------------ | ---------------------------- | --------------------------------------------------------------- | ----------- | -------- | -------------------- | --------------- |
| 1   | `visual-pattern-completion`    | Visual Pattern Completion    | What comes next in the row?                                     | choice      | accuracy | sí                   | ✅ implementado |
| 2   | `number-pattern-completion`    | Number Pattern Completion    | Find the missing number in grids, pyramids, wheels and crosses. | numeric     | accuracy | sí                   | ✅ implementado |
| 3   | `shape-rotation`               | Shape Rotation               | Turn it in your head.                                           | choice      | accuracy | sí                   | ✅ implementado |
| 4   | `matrix-reasoning`             | Matrix Reasoning             | Find the rules of rows and columns.                             | choice      | accuracy | sí                   | ✅ implementado |
| 5   | `sequence-prediction`          | Sequence Prediction          | Where will it be next?                                          | choice      | accuracy | sí                   | ✅ implementado |
| 6   | `symmetry-recognition`         | Symmetry Recognition         | Fold it in your head.                                           | mixed       | accuracy | sí                   | ✅ implementado |
| 7   | `spatial-transformation`       | Spatial Transformation       | Turn it, flip it, picture the result.                           | choice      | accuracy | sí                   | ✅ implementado |
| 8   | `rule-based-pattern-discovery` | Rule-Based Pattern Discovery | Work out the rule from examples.                                | choice      | accuracy | sí                   | ✅ implementado |
| 9   | `grid-and-path-reasoning`      | Grid and Path Reasoning      | Find your way through the maze.                                 | mixed       | accuracy | sí                   | ✅ implementado |
| 10  | `abstract-pattern-challenge`   | Abstract Pattern Challenge   | One panel breaks the rule. Which one?                           | choice      | accuracy | sí                   | ✅ implementado |

## Programación

| #   | id                       | Juego                  | Mecánica                                           | Interacción | Métricas                        | Sin límite de tiempo          | Estado          |
| --- | ------------------------ | ---------------------- | -------------------------------------------------- | ----------- | ------------------------------- | ----------------------------- | --------------- |
| 1   | `code-memory`            | Code Memory            | Records, calls, state and positions — from memory. | mixed       | accuracy, response-time, streak | sí                            | ✅ implementado |
| 2   | `algorithmic-logic`      | Algorithm Tracing      | Dependencies, traces and constraints.              | mixed       | accuracy, response-time, streak | sí                            | ✅ implementado |
| 3   | `bug-hunter`             | Bug Hunter             | One artifact, a few rules, exactly one bug.        | mixed       | accuracy, response-time, streak | sí                            | ✅ implementado |
| 4   | `code-scan`              | Code Comparison        | Spot the one token that changed.                   | mixed       | accuracy, response-time, streak | no (la velocidad es la tarea) | ✅ implementado |
| 5   | `pattern-architect`      | Pattern Architect      | Find the rule, then apply it.                      | choice      | accuracy, response-time, streak | sí                            | ✅ implementado |
| 6   | `variable-tracking`      | Variable Tracking      | Keep every variable straight, line by line.        | mixed       | accuracy, response-time, streak | sí                            | ✅ implementado |
| 7   | `conditional-logic`      | Conditional Logic      | Which branch runs?                                 | choice      | accuracy, response-time, streak | sí                            | ✅ implementado |
| 8   | `loop-prediction`        | Loop Prediction        | How many turns, and what is left at the end?       | mixed       | accuracy, response-time, streak | sí                            | ✅ implementado |
| 9   | `dependency-ordering`    | Dependency Ordering    | What has to happen before what?                    | mixed       | accuracy, response-time, streak | sí                            | ✅ implementado |
| 10  | `algorithm-construction` | Algorithm Construction | Put the blocks in the order that works.            | ordering    | accuracy, response-time, streak | sí                            | ✅ implementado |

## Notas de correspondencia con la especificación

- Programación: _Algorithm Tracing_ = `algorithmic-logic`, _Code Comparison_ = `code-scan` (ids conservados para no invalidar el progreso guardado), _Data Structure Reasoning_ = `pattern-architect` (árboles, grafos y estructuras equivalentes).
- Velocidad: _Code Scan_ = `code-scan-sprint` (localizar líneas por consulta; distinto del juego de programación de comparar snippets).
- Colecciones transversales: _Spatial reasoning_ (habilidades `spatial-reasoning`/`visual-orientation`) y _Concentration_ (`concentration`/`sustained-attention`) cruzan categorías.
- Memoria auditiva: no hay estímulos de audio en esta versión (roadmap P2-11).
- Recuerdo a largo plazo: la recuperación espaciada existe en el curso de programación; en los juegos de memoria queda como P3.
