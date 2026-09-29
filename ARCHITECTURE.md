# Architecture — Cognitive Programming Training Platform

> Estado: **aprobada** (2026-09-29). Decisiones registradas en §15.
> Código, identificadores y UI en inglés; documentación en español.

---

## 1. Resumen

El producto no es una colección de minijuegos, sino un **motor cognitivo** (dominio + engine puros, sin React)
sobre el que cada juego se declara como un **módulo de contenido** (niveles + generador + solver) más un
**renderer** de React. La UI solo orquesta y presenta; toda regla de negocio (evaluación, tiempos, scoring,
dificultad, progreso) vive en TypeScript puro ejecutable en Node.

```text
 ┌──────────────────────────────────────────────────────────────┐
 │ app/          composition root: router, providers, DI        │
 │ features/     pantallas (home, catalog, intro, play, results) │  ← React
 │ components/   UI primitives, layout, feedback                 │
 │ games/*/ui    renderers de contenido por juego                │
 ├──────────────────────────────────────────────────────────────┤
 │ engine/       GameEngine, GameSession, AssessmentEngine       │  ← TS puro, con estado
 ├──────────────────────────────────────────────────────────────┤
 │ games/*/content  niveles, generadores, solvers                │  ← TS puro, sin estado
 │ domain/       modelos, políticas (scoring, difficulty),       │
 │               métricas, puertos (Clock, Random, Repository)   │
 ├──────────────────────────────────────────────────────────────┤
 │ infrastructure/  SystemClock, CryptoSeedSource,               │  ← implementa puertos
 │                  LocalStorageProgressRepository               │
 └──────────────────────────────────────────────────────────────┘
```

### Regla de dependencias

El diagrama del documento original (`UI → Application → Domain → Infrastructure`) describe el **flujo de
llamadas**. La dirección de los **imports** es distinta: la infraestructura depende del dominio (implementa
sus puertos), nunca al revés.

| Capa                                      | Puede importar                          | No puede importar                |
| ----------------------------------------- | --------------------------------------- | -------------------------------- |
| `domain/`                                 | nada externo                            | React, DOM, engine, games, infra |
| `games/*/content/`                        | `domain/`                               | React, DOM, engine, infra        |
| `engine/`                                 | `domain/`                               | React, DOM, infra                |
| `infrastructure/`                         | `domain/` (puertos), APIs del navegador | React, features                  |
| `games/*/ui/`, `components/`, `features/` | todo lo anterior salvo infra            | infra (se inyecta vía `app/`)    |
| `app/`                                    | todo                                    | —                                |

Esto **ya está forzado por ESLint** (`eslint.config.js`): en las capas puras están prohibidos `react*`,
`window`, `document`, `localStorage`, `Math.random`, `Date.now` y `performance.now`.

---

## 2. Decisiones respecto a la estructura propuesta

| Propuesta original                                           | Decisión                                                                               | Motivo                                                                                                                                                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/games/<area>` (UI) + `data/` (contenido) separados | **`games/<id>/` autocontenido** con `content/` (puro) y `ui/` (React)                  | Agregar un juego = crear **una** carpeta y registrarla. Separar contenido y UI en árboles distintos reparte un mismo juego en 3 sitios. La pureza de `content/` la garantiza ESLint, no la ubicación. |
| `engine/ScoringEngine`, `engine/DifficultyEngine`            | **Políticas en `domain/scoring` y `domain/difficulty`** (strategies + funciones puras) | No tienen estado ni ciclo de vida; un "engine" que envuelve una función pura sería una abstracción prematura. El `GameEngine` las recibe inyectadas.                                                  |
| `engine/SessionEngine`                                       | `domain/session` (**reducer puro**) + `engine/GameSession` (fachada con Clock)         | El núcleo de la sesión es una máquina de estados pura, trivial de testear; la fachada añade tiempo y suscripción.                                                                                     |
| `services/`, `utils/`, `types/`, `hooks/` globales           | **Eliminados como carpetas top-level**                                                 | Los tipos viven junto a su módulo; utilidades aleatorias en `domain/random`; servicios = `infrastructure/`; hooks junto a la feature que los usa. Evita "cajones de sastre".                          |
| `data/levels`                                                | `games/<id>/content/levels.ts`                                                         | Los niveles son parte del diseño de cada juego.                                                                                                                                                       |

---

## 3. Estructura de carpetas

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   ├── providers/ServicesProvider.tsx   # DI: engine, registry, clock, repository
│   └── composition.ts                   # construye los servicios reales (único sitio con `new SystemClock()`)
│
├── domain/
│   ├── shared/        # CognitiveArea, DifficultyLevel, ProgrammingSkill, ids con marca, Result<T,E>
│   ├── random/        # RandomGenerator, mulberry32, deriveSeed, helpers (int, pick, shuffle, sample)
│   ├── time/          # Clock (solo interfaz)
│   ├── challenge/     # Challenge<Area, Content> genérico, ResponseFormat, Answer, evaluateAnswer, validateChallenge
│   ├── difficulty/    # DifficultyProfile, tiers, DifficultyStrategy, RuleBasedDifficultyStrategy
│   ├── scoring/       # ScoringStrategy, ScoringConfig, StandardScoringStrategy
│   ├── session/       # SessionState, sessionReducer, PerformanceMetrics, computeMetrics
│   ├── game/          # GameDefinition, GameRegistry
│   ├── progress/      # UserProgress, applySessionResult, ProgressRepository (puerto)
│   └── assessment/    # AssessmentDefinition, CognitiveScore, CognitiveProfile
│
├── engine/
│   ├── GameEngine.ts      # resuelve juego → genera challenges → crea GameSession
│   ├── GameSession.ts     # fachada con estado sobre sessionReducer + Clock + subscribe()
│   └── AssessmentEngine.ts  (Fase 9)
│
├── games/
│   ├── registry.ts        # lista de GameModules
│   ├── logic/
│   │   ├── content/       # levels.ts, generators/*.ts, solvers/*.ts  (puro)
│   │   ├── ui/            # renderers de cada content.kind
│   │   └── index.ts       # export const logicModule: GameModule
│   ├── memory/  speed/  attention/  patterns/   (misma forma)
│
├── infrastructure/
│   ├── SystemClock.ts
│   ├── CryptoSeedSource.ts
│   └── LocalStorageProgressRepository.ts
│
├── components/
│   ├── ui/            # Button, Card, Badge, Kbd, ProgressBar…
│   ├── layout/        # AppShell, PageHeader
│   ├── feedback/      # AnswerFeedback, Timer, ScoreTicker
│   └── response/      # inputs genéricos por ResponseFormat (choice, ordering, locate, numeric)
│
├── features/
│   ├── home/  catalog/  game-intro/  play/  results/  profile/  assessment/
│
└── test/
    ├── setup.ts
    └── fakes/         # FakeClock, SequenceRandom, InMemoryProgressRepository, renderWithServices
```

Los tests se colocan **junto al código** (`*.test.ts`). `src/test/` solo contiene setup y fakes compartidos.

---

## 4. Domain model

### 4.1 Primitivos

```ts
type CognitiveArea = 'logic' | 'memory' | 'speed' | 'attention' | 'patterns';
type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type DifficultyTier = 'fundamentals' | 'intermediate' | 'advanced' | 'expert'; // 1–3 | 4–6 | 7–8 | 9–10

type ProgrammingSkill =
  | 'decomposition'
  | 'abstraction'
  | 'pattern-recognition'
  | 'logical-reasoning'
  | 'working-memory'
  | 'attention'
  | 'debugging'
  | 'algorithmic-thinking';

type GameId = string & { readonly __brand: 'GameId' }; // ids con marca: no se mezclan
type ChallengeId = string & { readonly __brand: 'ChallengeId' };
type Seed = number & { readonly __brand: 'Seed' }; // uint32 validado por parseSeed()

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

`isDifficultyLevel(n)` / `toDifficultyLevel(n)` validan en los bordes (URL, storage); dentro del dominio el
tipo garantiza el rango.

### 4.2 Formatos de respuesta (genéricos y reutilizables)

La **forma de responder** es independiente del **contenido** del challenge. Cuatro formatos cubren los cinco
juegos, y cada uno tiene una única función de evaluación → cero duplicación entre juegos.

```ts
interface ResponseFormats {
  'single-choice': {
    question: { options: readonly { id: string; label: string }[] };
    solution: { optionId: string };
    answer: { optionId: string };
  };
  ordering: {
    question: { items: readonly { id: string; label: string }[] };
    solution: { order: readonly string[] };
    answer: { order: readonly string[] };
  };
  locate: {
    // señalar una línea/registro/celda del contenido mostrado (índice 0-based)
    question: { itemCount: number };
    solution: { index: number };
    answer: { index: number };
  };
  numeric: {
    question: { unit?: string };
    solution: { value: number };
    answer: { value: number };
  };
}
type ResponseFormat = keyof ResponseFormats;

// Question y Solution correlacionados por `format` (discriminated union generada)
type Response = {
  [F in ResponseFormat]: {
    format: F;
    question: ResponseFormats[F]['question'];
    solution: ResponseFormats[F]['solution'];
  };
}[ResponseFormat];

type Answer = {
  [F in ResponseFormat]: { format: F } & ResponseFormats[F]['answer'];
}[ResponseFormat];

function evaluateAnswer(response: Response, answer: Answer): Result<boolean, AnswerError>;
// AnswerError: 'FORMAT_MISMATCH' | 'UNKNOWN_OPTION' | 'INVALID_ORDERING' | 'OUT_OF_RANGE' | 'NOT_A_NUMBER'
```

`question` y `solution` están separados a propósito: cuando exista backend, el cliente recibirá solo
`question` y el servidor evaluará con `solution` **sin cambiar el modelo**.

### 4.3 Challenge

Implementación: `src/domain/challenge/challenge.ts`. El dominio define un `Challenge<Area, Content>`
**genérico**; el union concreto de los cinco juegos se arma en `games/` (cada juego exporta su tipo). Así el
dominio nunca importa contenido de un juego y agregar uno no toca `domain/` (consecuencia de D3).

```ts
interface Challenge<A extends CognitiveArea, C extends ChallengeContent /* { kind: string } */> {
  id: ChallengeId; // `${gameId}:${level}:${seed}` → reproducible y trazable
  gameId: GameId;
  area: A;
  level: DifficultyLevel;
  seed: Seed;
  prompt: string; // "¿Cuál de estas secuencias de ejecución es válida?"
  content: C; // qué se muestra (específico del juego, discriminado por `kind`)
  response: Response; // cómo se responde + solución
  explanation: string; // por qué la respuesta es correcta (se muestra en feedback)
  skills: readonly ProgrammingSkill[];
  timing: {
    studyMs: number | null; // Memory: fase de memorización antes de ocultar
    limitMs: number | null; // límite de respuesta; null = sin límite
    targetMs: number; // tiempo "esperado" para el speed bonus y la dificultad adaptativa
  };
}

// games/<id>/content/types.ts
type LogicChallenge = Challenge<'logic', LogicContent>;
type MemoryChallenge = Challenge<'memory', MemoryContent>;
// …
// games/types.ts
type AnyGameChallenge =
  LogicChallenge | MemoryChallenge | SpeedChallenge | AttentionChallenge | PatternChallenge;

// Ejemplo de contenido
type LogicContent =
  | { kind: 'dependency-order'; nodes: readonly string[]; edges: readonly [string, string][] }
  | { kind: 'program-trace'; lines: readonly PseudoLine[]; ask: TraceQuestion }
  | {
      kind: 'constraint-arrangement';
      entities: readonly string[];
      rules: readonly ConstraintRule[];
    };
```

El contenido usa **pseudocódigo neutral** (`PseudoLine` estructurado → renderizado), nunca sintaxis de un
lenguaje concreto.

### 4.4 GameDefinition (independiente de React)

```ts
interface GameDefinition<
  C extends Challenge = Challenge,
  P extends DifficultyProfile = DifficultyProfile,
> {
  id: GameId;
  name: string; // 'Algorithmic Logic'
  tagline: string;
  description: string;
  area: C['area'];
  skills: readonly ProgrammingSkill[];
  instructions: readonly string[];
  levels: LevelTable<P>; // exactamente los niveles 1..10 (tipo Record<DifficultyLevel, P>)
  generate(params: GenerationParams<C, P>): C;
  scoring?: Partial<ScoringConfig>; // override declarativo (p.ej. Speed pondera más el tiempo)
}

interface GenerationParams<C, P> {
  identity: ChallengeIdentity<C['area']>; // id, gameId, area, level, seed ya calculados
  profile: P;
  random: RandomGenerator; // ya sembrado con identity.seed
}

// Punto de entrada público y reproducible:
function generateChallenge<C, P>(
  game: GameDefinition<C, P>,
  opts: { level: DifficultyLevel; seed: number },
): C;
// lanza InvalidSeedError si seed no es uint32 entero, y ChallengeGenerationError si el generador
// devuelve un challenge inválido (validateChallenge) o altera la identidad. Nada falla en silencio.
```

El renderer de React vive aparte:

```ts
// games/<id>/index.ts
interface GameModule<C extends Challenge> {
  definition: GameDefinition<C>;
  ContentView: ComponentType<{ content: C['content']; phase: ChallengePhase }>;
}
```

`games/registry.ts` es el único sitio donde se enumeran los juegos. El dominio conoce solo `GameDefinition`
vía `GameRegistry` (`get(id): GameDefinition | undefined`, `list()`, `byArea()`). `createGameRegistry`
valida cada tabla de niveles al arrancar: un juego mal definido falla al inicio, no a mitad de sesión.

---

## 5. Aleatoriedad y tiempo (puertos)

```ts
interface RandomGenerator {
  next(): number;
} // [0, 1)
function mulberry32(seed: Seed): RandomGenerator; // PRNG sembrado, 32 bits, rápido y suficiente
function deriveSeed(parent: Seed, index: number): Seed; // mezcla hash → seed independiente por challenge

interface Clock {
  now(): number;
} // ms, monótono, alta resolución
interface SeedSource {
  next(): Seed;
} // CryptoSeedSource en prod, FixedSeedSource en tests
```

- **Seeds**: la sesión recibe un `sessionSeed`; el challenge _i_ usa `deriveSeed(sessionSeed, i)`. Cualquier
  challenge es reproducible de forma aislada (`generateChallenge({ level, seed })`), y una sesión completa es
  reproducible desde su seed. El seed se muestra en la UI → "jugar este seed otra vez" / compartir.
- **SystemClock** = `performance.timeOrigin + performance.now()`: monótono (no salta con cambios del reloj
  del sistema), precisión sub-ms, y además comparable con epoch para persistir timestamps. Un solo método.

---

## 6. Game Session

### 6.1 Máquina de estados

```text
            start()
  (created) ───────▶ PRESENTING[i] ──(studyMs? )──▶ STUDYING[i] ──endStudy()/timeout──┐
                          │ sin study                                                  │
                          └──────────────────────────▶ RESPONDING[i] ◀─────────────────┘
                                                          │
                          submitAnswer(a) / expire()      │  (tiempo desde que se empezó a responder)
                                                          ▼
                                                     FEEDBACK[i]   (outcome + explanation; tiempo no cuenta)
                                                          │ advance()
                                          i < n-1 ────────┴──────── i = n-1
                                             ▼                        ▼
                                     PRESENTING[i+1]               FINISHED ──▶ GameResult
                           finish() desde cualquier estado → FINISHED (completed: false)
```

- `PRESENTING → RESPONDING/STUDYING` ocurre con `session.present()`, que la UI invoca **tras el paint**
  (`requestAnimationFrame` dentro de un effect) para que el tiempo de renderizado no contamine el
  response time.
- El **límite de tiempo es autoritativo en el dominio**: `submitAnswer` compara `clock.now()` con el deadline
  y registra `timedOut` aunque el timer de la UI se haya retrasado. El timer de la UI solo dispara `expire()`.
- El estado `FEEDBACK` hace imposibles las respuestas dobles (doble clic) y separa "tiempo de respuesta" de
  "tiempo leyendo la explicación".

### 6.2 Núcleo puro + fachada

```ts
// domain/session — puro, sin reloj propio: el tiempo llega en los eventos
type SessionEvent =
  | { type: 'presented'; at: number }
  | { type: 'studyEnded'; at: number }
  | { type: 'answered'; answer: Answer; at: number }
  | { type: 'expired'; at: number }
  | { type: 'advanced'; at: number }
  | { type: 'finished'; at: number };

function sessionReducer(
  state: SessionState,
  event: SessionEvent,
): Result<SessionState, SessionError>;
// SessionError: 'SESSION_FINISHED' | 'INVALID_TRANSITION' | 'INVALID_ANSWER' (con AnswerError)

// engine/GameSession — añade Clock, scoring y suscripción
interface GameSession {
  readonly state: SessionSnapshot; // inmutable
  present(): Result<void, SessionError>;
  endStudy(): Result<void, SessionError>;
  submitAnswer(a: Answer): Result<AnswerOutcome, SessionError>;
  expire(): Result<AnswerOutcome, SessionError>;
  advance(): Result<void, SessionError>;
  finish(): GameResult;
  subscribe(listener: () => void): () => void; // para useSyncExternalStore
}

interface GameEngine {
  startSession(config: SessionConfig): GameSession;
}
interface SessionConfig {
  gameId: GameId;
  level: DifficultyLevel;
  seed?: Seed; // si falta, SeedSource
  challengeCount?: number; // default: profile.challengeCount
  assisted?: boolean; // modo accesible: sin límite de tiempo (resultado marcado como assisted)
}
```

**Errores**: los errores esperables (transición inválida, respuesta mal formada, sesión terminada) se
devuelven como `Result` tipado — nunca se ignoran ni se tragan. Las violaciones de programación
(juego inexistente, seed inválido, `challengeCount < 1`) lanzan excepciones específicas en `startSession`.

### 6.3 Registro por challenge y resultado

```ts
interface ChallengeRecord {
  challengeId: ChallengeId;
  kind: string; // content.kind → breakdowns por tipo
  skills: readonly ProgrammingSkill[];
  outcome: 'correct' | 'incorrect' | 'timed-out' | 'skipped';
  answer: Answer | null;
  attempts: number;
  presentedAt: number | null; // null si nunca se mostró (skipped)
  respondStartedAt: number | null; // tras la fase de estudio
  answeredAt: number | null;
  responseTimeMs: number | null; // answeredAt - respondStartedAt, solo respuestas a tiempo
  points: ChallengePoints; // desglose del scoring (ver §7)
}

interface PerformanceMetrics {
  total: number;
  attempted: number; // total − skipped
  correct: number;
  incorrect: number;
  timedOut: number;
  skipped: number;
  accuracy: number; // correct / attempted (timed-out cuenta como fallo; skipped no cuenta); 0 si attempted = 0
  averageResponseMs: number | null;
  medianResponseMs: number | null; // la mediana es la usada por la dificultad adaptativa (robusta a outliers)
  fastestResponseMs: number | null;
  longestStreak: number; // derivada de la secuencia de outcomes, no almacenada
  byKind: Record<string, { total: number; correct: number }>;
  bySkill: Partial<Record<ProgrammingSkill, { total: number; correct: number }>>;
}

interface GameResult {
  gameId;
  level;
  seed;
  assisted: boolean;
  completed: boolean;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  records: readonly ChallengeRecord[];
  metrics: PerformanceMetrics;
  score: SessionScore; // total, maxPossible, performanceIndex (0–100)
  recommendation: LevelRecommendation; // de la DifficultyStrategy
}
```

Las métricas específicas de cada juego se obtienen **genéricamente** de `byKind` / `bySkill`, sin código
de métricas por juego.

---

## 7. Scoring

`ScoringStrategy` es pura y configurable; el engine la recibe inyectada (default: `StandardScoringStrategy`
con `DEFAULT_SCORING_CONFIG`, que cada juego puede sobrescribir parcialmente vía `definition.scoring`).

```ts
interface ScoringStrategy {
  scoreChallenge(input: ChallengeScoringInput): ChallengePoints;
  scoreSession(records: readonly ChallengeRecord[], level: DifficultyLevel): SessionScore;
}
interface ChallengeScoringInput {
  outcome;
  level;
  responseTimeMs: number | null;
  targetMs: number;
  streakBefore: number;
  attempts: number;
}
```

### Fórmulas (config por defecto)

| Símbolo | Significado                                  | Default |
| ------- | -------------------------------------------- | ------- |
| `B`     | puntos base por challenge                    | 100     |
| `k`     | incremento del multiplicador por nivel       | 0.25    |
| `Smax`  | speed bonus máximo (fracción de la base)     | 0.5     |
| `σ`     | bonus por racha por challenge consecutivo    | 0.05    |
| `σmax`  | tope del bonus por racha                     | 0.25    |
| `r`     | decaimiento por intento adicional            | 0.5     |
| `P`     | penalización por error (fracción de la base) | 0.25    |

```text
difficultyMultiplier  m(L)  = 1 + k·(L − 1)                      L1 = 1.00 … L10 = 3.25
speedBonus            s(t)  = Smax · clamp(1 − t / targetMs, 0, 1)   (0 si no hay respuesta correcta)
streakBonus           z     = min(σ · streakBefore, σmax)
attemptFactor         a     = (1 − r)^(attempts − 1)

correcta:    points = B · m(L) · (1 + s + z) · a
incorrecta:  points = −P · B                                   (no escala con el nivel: no castigar subir)
timed-out:   points = 0                                        (sin respuesta ≠ respuesta equivocada)
skipped:     points = 0

sessionScore.total     = max(0, Σ points)
sessionScore.maxPossible = Σ B · m(L) · (1 + Smax + z_max_i)  (todas correctas, t = 0, racha completa)
accuracy               = correct / (total − skipped)
speedIndex             = media de clamp(1 − t / targetMs, 0, 1) sobre respuestas correctas
performanceIndex       = round(100 · (0.75 · accuracy + 0.25 · speedIndex))   ∈ [0, 100]
```

Justificación: la precisión domina (75 %) para **no premiar la velocidad a costa de la corrección**; el speed
bonus solo existe sobre respuestas correctas; la penalización impide que responder al azar sea rentable en
single-choice con 4 opciones (valor esperado del azar: `0.25·100 − 0.75·25 ≈ +6` en L1, cercano a cero,
frente a 100–175 puntos de una respuesta correcta en L1). Speed usa `Smax = 1.0` y ponderación `0.6/0.4`.

---

## 8. Difficulty

### 8.1 Perfil por nivel

Cada juego define **exactamente 10 perfiles** tipados. Un perfil = base común + parámetros propios del juego
(la única fuente de verdad que consume el generador; no hay dos tablas paralelas que puedan divergir).

```ts
interface DifficultyProfile {
  level: DifficultyLevel;
  tier: DifficultyTier;
  objective: string; // propósito cognitivo del nivel (se muestra en la intro)
  challengeCount: number;
  timing: { studyMs: number | null; limitMs: number | null; targetMs: number };
}

// Ejemplo: Logic
interface LogicProfile extends DifficultyProfile {
  kinds: readonly LogicContent['kind'][]; // qué tipos de challenge aparecen
  nodeCount: number; // numberOfElements
  dependencyCount: number; // aristas del DAG
  nestingDepth: number; // complexity en program-trace
  variableCount: number; // memoryLoad
  distractors: number; // opciones incorrectas "cercanas"
  constraintCount: number; // decisionCount
}
```

Las dimensiones del documento (`complexity`, `memoryLoad`, `sequenceLength`, `numberOfDistractors`,
`timeLimit`, `numberOfElements`, `abstractionLevel`, `visualNoise`, `decisionCount`, `dependencyCount`) son el
**vocabulario común**: cada juego usa las que tienen sentido con esos mismos nombres. Un test de propiedad
verifica por juego que ninguna dimensión **decrece** al subir de nivel y que al menos una **crece** entre
niveles consecutivos (salvo cambios de `kinds` documentados).

Los niveles 9–10 no aumentan tamaño a secas: añaden **tipos de razonamiento** nuevos (p.ej. en Logic,
"¿cuántas rondas mínimas con ejecución en paralelo?" → camino crítico; en Memory, preguntas cruzadas entre
registros; en Patterns, composición de 3 transformaciones).

### 8.2 Dificultad adaptativa

```ts
interface DifficultyStrategy {
  determineNextLevel(context: {
    currentLevel: DifficultyLevel;
    performance: PerformanceMetrics;
    targetMs: number;
  }): LevelRecommendation;
}
interface LevelRecommendation {
  level: DifficultyLevel;
  direction: 'up' | 'stay' | 'down';
  reason: string;
}
```

`RuleBasedDifficultyStrategy` (umbrales configurables):

```text
accuracy ≥ 0.90 AND medianResponse ≤ targetMs   → up   (clamp a 10)
accuracy <  0.60                                → down (clamp a 1)
otherwise                                       → stay
```

Se usa para la recomendación en la pantalla de resultados. En el futuro, una estrategia tipo
staircase/Elo sustituye esta implementación sin tocar engine ni UI.

---

## 9. Calidad del contenido generado

Cada generador tiene un **solver independiente** en `content/solvers/`:

- Los challenges se construyen de forma que el solver verifique **una única respuesta correcta** (p.ej. un
  `constraint-arrangement` se genera y se valida por fuerza bruta sobre ≤ 7! permutaciones; si hay 0 o >1
  soluciones, se regenera con el siguiente sub-seed, con un límite de intentos que lanza error si se agota).
- Los distractores son **plausibles** (errores típicos: ignorar una dependencia, off-by-one, evaluar la
  condición al revés), nunca aleatorios sin sentido, y **distintos** entre sí y de la solución.
- Tests de propiedad por nivel sobre cientos de seeds: validez, unicidad, determinismo, rangos del perfil.

Borradores de juegos (el diseño completo por nivel irá en `GAME_DESIGN.md`, fases 4–8):

| Juego                 | Tipos de challenge                                                                                | Ejes de dificultad principales                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Algorithmic Logic** | dependency-order, program-trace, constraint-arrangement, critical-path (9–10)                     | nodos, dependencias, anidación, variables, restricciones                           |
| **Code Memory**       | record-recall, sequence-recall, variable-state (asignaciones encadenadas), cross-reference (9–10) | campos/registros, longitud, tiempo de estudio ↓, interferencia (valores similares) |
| **Code Scan**         | same-or-different, find-the-diff-line (typo, operador, variable, condición, número)               | longitud del snippet, sutileza del cambio, límite de tiempo ↓                      |
| **Bug Hunter**        | rule-violation (registros/listas/pseudocódigo con una anomalía respecto a una regla)              | tamaño, distractores near-miss, reglas simultáneas, ruido visual                   |
| **Pattern Architect** | sequence-rule, transform-inference (ejemplos entrada→salida), structure-analogy (árboles/grafos)  | composición de reglas (1→3), abstracción, estructuras                              |

---

## 10. Estado en React

Sin librería de estado global:

- **Servicios** (engine, registry, repository, clock) se inyectan con un `ServicesProvider` (contexto). Los
  tests montan el árbol con fakes (`FakeClock`, `FixedSeedSource`, `InMemoryProgressRepository`).
- **Sesión**: `useGameSession(config)` crea la `GameSession` y la expone con `useSyncExternalStore`. La UI lee
  el snapshot y llama a comandos; no calcula nada.
- **Timers** (`useChallengeTimer`): solo presentan el tiempo restante y disparan `expire()`/`endStudy()`.

### Rutas

```text
/                               Home
/games                          Catálogo (5 áreas)
/games/:gameId                  Intro: objetivo, instrucciones, selector de nivel, récord, métricas
/games/:gameId/play/:level      Juego (?seed=123 para reproducir); al terminar muestra resultados en la misma ruta
/profile                        Progreso local
/assessment                     (Fase 9)
```

Mostrar los resultados en la ruta de juego evita pasar el resultado por el estado del router (se perdería al
recargar). "Repetir" crea sesión con seed nuevo; "Siguiente nivel" navega a `level + 1`.

---

## 11. Persistencia

```ts
interface UserProgress {
  schemaVersion: 1;
  games: Record<string, { levels: Partial<Record<DifficultyLevel, LevelRecord>> }>;
  recentSessions: readonly SessionSummary[]; // últimas 50
}
interface LevelRecord {
  plays: number;
  bestScore: number;
  bestAccuracy: number;
  bestPerformanceIndex: number;
  lastPlayedAt: number;
}

function applySessionResult(progress: UserProgress, result: GameResult): UserProgress; // puro, en domain

interface ProgressRepository {
  // asíncrono: decisión D1
  get(): Promise<UserProgress | null>;
  save(progress: UserProgress): Promise<void>;
  clear(): Promise<void>;
}
```

`LocalStorageProgressRepository` valida el JSON leído con type guards escritos a mano y un campo
`schemaVersion` (datos corruptos → se descartan y se informa, no se rompe la app). Las sesiones `assisted`
se guardan pero no cuentan como récord.

---

## 12. Cognitive Assessment (preparado, Fase 9)

```ts
interface AssessmentDefinition {
  id;
  name;
  sections: readonly AssessmentSection[];
}
interface AssessmentSection {
  area: CognitiveArea;
  gameId: GameId;
  plan: readonly DifficultyLevel[];
} // p.ej. [2,4,6,8]
interface CognitiveScore {
  value: number /* 0–100 */;
  band: 'developing' | 'solid' | 'strong' | 'exceptional';
  sampleSize: number;
}
interface CognitiveProfile {
  logic;
  memory;
  speed;
  attention;
  patterns: CognitiveScore;
  overall: CognitiveScore;
}
```

El `AssessmentEngine` **reutiliza `GameEngine`** (una sesión por sección) y agrega los `performanceIndex`
ponderados por nivel. Se presenta como **Programming Cognitive Index / Performance Profile**, nunca como IQ:
las puntuaciones son relativas a la dificultad de los ítems, **no a normas poblacionales**, y la UI incluye
un aviso explícito de que es una herramienta recreativa de entrenamiento, no un diagnóstico psicométrico.

---

## 13. Estrategia de testing

| Nivel           | Qué se prueba                                                                                                                                                                                                                                                                                                                                                | Herramientas                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| Domain          | `evaluateAnswer` por formato (válida, inválida, vacía, formato erróneo), fórmulas de scoring (L1, L10, score 0, máximo, t = 0, t ≫ target, intentos múltiples), `RuleBasedDifficultyStrategy` (umbrales exactos, clamps 1/10), `computeMetrics`, `applySessionResult`, PRNG (determinismo, rango, `deriveSeed`), `parseSeed` (negativo, decimal, NaN, > 2³²) | Vitest                         |
| Session/Engine  | Todas las transiciones válidas e inválidas del reducer; respuesta correcta/incorrecta/timeout autoritativo con `FakeClock`; respuesta en `FEEDBACK` o tras `FINISHED`; `finish()` anticipado; progresión y resultado final; juego inexistente                                                                                                                | Vitest + FakeClock             |
| Contenido (×5)  | Por nivel × N seeds: determinismo, solución única verificada por solver, distractores distintos, perfil monótono, sin `NaN`/vacíos, `sequenceLength` extremos                                                                                                                                                                                                | Vitest (bucles sembrados)      |
| Infraestructura | LocalStorage: round-trip, JSON corrupto, versión desconocida                                                                                                                                                                                                                                                                                                 | Vitest + jsdom                 |
| React           | Comportamiento: el usuario elige respuesta → aparece feedback textual → avanza → cambia el score; timer expira → timeout; navegación por teclado; resultados y "siguiente nivel"                                                                                                                                                                             | RTL + user-event + fake timers |

- Sin tests de "el componente existe".
- **Property-based sin dependencias nuevas**: bucles deterministas sobre rangos de seeds. `fast-check`
  añadiría shrinking, pero no se justifica todavía (se puede evaluar más adelante).
- Cobertura objetivo (umbral en `vite.config.ts` desde la Fase 3): `domain/`, `engine/`, `games/*/content/`
  ≥ 90 % líneas / 85 % ramas. La UI no tiene umbral: se mide por flujos cubiertos.

---

## 14. Stack y dependencias

| Paquete                                                                                                       | Por qué                                                                                       |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| react, react-dom, react-router 7                                                                              | requeridos por el stack                                                                       |
| vite 8, @vitejs/plugin-react, typescript 5.9                                                                  | build + TS estricto                                                                           |
| tailwindcss 4 + @tailwindcss/vite                                                                             | requerido; v4 no necesita PostCSS ni config JS                                                |
| vitest 4, @vitest/coverage-v8, jsdom                                                                          | tests + cobertura + DOM simulado                                                              |
| @testing-library/react, /dom, /jest-dom, /user-event                                                          | RTL; `user-event` simula interacción real (teclado, foco) y `jest-dom` da matchers accesibles |
| eslint 10, typescript-eslint (strictTypeChecked), react-hooks, react-refresh, eslint-config-prettier, globals | lint estricto + reglas de capas                                                               |
| prettier                                                                                                      | formato                                                                                       |

**Versiones fijadas por Node 20.20**: vitest 5, jsdom 30 y react-router 8 exigen Node ≥ 22. Si actualizas
Node a 22/24 LTS se pueden subir sin cambios de arquitectura. TypeScript queda en 5.9 porque
`typescript-eslint` aún no soporta TS ≥ 6.1.

No se añaden: librerías de estado (innecesarias), zod (un único esquema persistido → guards a mano),
librerías de animación (CSS + `prefers-reduced-motion`), fuentes web (stack de sistema monoespaciado).

`tsconfig.app.json` además de `strict` activa `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noImplicitOverride` y `noPropertyAccessFromIndexSignature`.

---

## 15. Decisiones aprobadas (2026-09-29)

| ID  | Decisión                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------- |
| D1  | `ProgressRepository` **asíncrono** (`Promise`), para que un `ApiProgressRepository` no obligue a reescribir consumidores. |
| D2  | **Todos los niveles abiertos**; insignia de "superado" (`performanceIndex ≥ 70`) y nivel recomendado destacado.           |
| D3  | Estructura de carpetas según §2–§3.                                                                                       |
| D4  | **Un intento por challenge** en el MVP (`maxAttempts = 1`); el modelo soporta varios.                                     |
| D5  | Repositorio git propio en `brainPractice/`.                                                                               |
