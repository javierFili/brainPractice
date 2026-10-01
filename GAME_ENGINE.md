# Game Engine

Cómo se ejecuta una sesión, desde `startSession` hasta `GameResult`. Todo lo descrito aquí es TypeScript
puro (`src/domain`, `src/engine`) y se ejecuta en Node sin navegador.

## Piezas

| Pieza                | Dónde                        | Responsabilidad                                                                                                                                           |
| -------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GameDefinition`     | `domain/game`                | Descripción pura de un juego: niveles 1–10, `generate()`, override opcional del scoring.                                                                  |
| `generateChallenge`  | `domain/game`                | Único punto de entrada a la generación. Inicializa el RNG con el seed, estampa la identidad, valida la salida y lanza un error ante challenges inválidos. |
| `sessionReducer`     | `domain/session`             | Máquina de estados pura. El tiempo llega dentro de los eventos.                                                                                           |
| `ScoringStrategy`    | `domain/scoring`             | Puntos por challenge y por sesión (`createStandardScoring`).                                                                                              |
| `DifficultyStrategy` | `domain/difficulty`          | Recomendación del siguiente nivel (`createRuleBasedDifficulty`).                                                                                          |
| `GameEngine`         | `engine/GameEngine.ts`       | Resuelve un juego, deriva un seed por challenge, los genera y crea una sesión.                                                                            |
| `GameSession`        | `engine/GameSession.ts`      | Fachada con estado: estampa los eventos con el `Clock`, notifica a los suscriptores y construye el resultado.                                             |
| `AssessmentRun`      | `engine/AssessmentEngine.ts` | Encadena `GameSession`s cortas entre áreas y puntúa un `CognitiveProfile`.                                                                                |

## Ciclo de vida de la sesión

```text
startSession ─▶ presenting ──present()──▶ studying ──endStudy()──▶ responding
                                  │  (no study phase)                  │
                                  └────────────────────────────────────┤
                                  submitAnswer(a) / expire()           ▼
                                                                    feedback ──advance()──▶ presenting (next) … ─▶ finished
                         finish() from any status ─▶ finished (remaining challenges = skipped)
```

```ts
const engine = createGameEngine({ registry, clock, seeds });
const session = engine.startSession({ gameId: 'algorithmic-logic', level: 7, seed: 12345 });

session.present(); // UI calls this after the challenge is painted
const r = session.submitAnswer({ format: 'numeric', value: 42 });
if (r.ok) console.log(r.value.outcome); // 'correct' | 'incorrect' | 'timed-out'
session.advance();
const result = session.finish(); // idempotent
```

Reglas que conviene conocer:

- **El tiempo manda en el dominio.** Una respuesta que llega después de `limitMs` es `timed-out` aunque el
  temporizador de la UI se haya retrasado. `expire()` antes del plazo devuelve `NOT_EXPIRED` con el tiempo
  restante.
- **Tiempo de respuesta** = instante de la respuesta − inicio de la ventana de respuesta (tras la fase de
  estudio). El tiempo de lectura del feedback nunca cuenta.
- **Los errores son valores.** Las transiciones inválidas, las respuestas mal formadas y los comandos sobre
  una sesión terminada devuelven errores `Result` (`INVALID_TRANSITION`, `INVALID_ANSWER`,
  `SESSION_FINISHED`, …); nunca se puntúan. Los errores de configuración (juego desconocido, seed inválido,
  número de challenges incorrecto) lanzan una excepción.
- El **modo asistido** ("Relaxed timing" en la UI) elimina el límite de respuesta y dobla el tiempo de
  estudio (`ASSISTED_STUDY_FACTOR`, selector `effectiveStudyMs`); el resultado queda marcado y no establece
  récords.
- Mientras un challenge con fase de estudio está en `presenting` (un frame), la UI ya lo pinta como
  estudio: la pregunta y las opciones nunca se ven antes de memorizar.

## Reproducibilidad

`sessionSeed` → `deriveSeed(sessionSeed, i)` → challenge _i_. El id del challenge es
`gameId:level:seed`, así que cualquier challenge puede regenerarse por separado con
`generateChallenge(game, { level, seed })`. El seed se muestra en la pantalla de resultados y se acepta
como `?seed=` en la URL de juego. Los golden tests fijan el PRNG (`mulberry32`) y `deriveSeed`; cambiar
cualquiera de los dos cambia todos los seeds compartidos.

## Scoring (valores por defecto, `DEFAULT_SCORING_CONFIG`)

```text
m(L)      = 1 + 0.25·(L − 1)                 difficulty multiplier (L1 = 1, L10 = 3.25)
pace      = clamp(1 − t / targetMs, 0, 1)
correct   = 100 · m(L) · (1 + 0.5·pace + min(0.05·streak, 0.25)) · 0.5^(attempts − 1)
incorrect = −25            timed-out / skipped = 0            session total = max(0, Σ)

accuracy          = correct / attempted            (time-outs count as attempted, skipped do not)
speedIndex        = Σ_correct pace / attempted     (speed only counts on correct answers)
performanceIndex  = round(100 · (0.75·accuracy + 0.25·speedIndex))     ∈ [0, 100]
```

Los juegos pueden sobrescribir las constantes (`definition.scoring`); Code Scan usa un bonus de velocidad
completo y una ponderación precisión/velocidad de 60/40. Todas las fórmulas viven en
`domain/scoring/standardScoring.ts`, junto con sus tests.

## Dificultad adaptativa

`createRuleBasedDifficulty()`:

```text
attempted < 3                              → stay (not enough evidence)
accuracy ≥ 0.90 AND medianPace ≤ 1         → up
accuracy < 0.60                            → down
otherwise                                  → stay            (always clamped to 1–10)
```

`medianPace` es la mediana de `responseTime / targetMs`, por lo que es comparable entre tipos de challenge
con objetivos distintos.

## Extensión

### Una nueva estrategia de scoring

Implementa `ScoringStrategy` y pasa una factoría al engine:
`createGameEngine({ …, createScoring: (overrides) => myScoring(overrides) })`. Mantenla pura y documenta
la fórmula en su JSDoc.

### Una nueva estrategia de dificultad

Implementa `DifficultyStrategy.determineNextLevel({ currentLevel, performance })` (p. ej. un modelo
staircase o Elo) y pásala como `difficulty` a `createGameEngine`. No cambia nada más.

### Un nuevo tipo de challenge o un nuevo juego

Ver [CONTRIBUTING.md](CONTRIBUTING.md).
