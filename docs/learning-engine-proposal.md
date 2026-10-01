# Learning Engine — Propuesta (Phase 0)

> Estado: **propuesta**, pendiente de aprobación. No hay código de Learning todavía. Este documento
> fija qué se construye en las fases 2–4, qué se reutiliza del sistema de juegos y qué decisiones
> arquitectónicas implica.

## 1. Objetivo

Añadir el pilar **LEARN** (Programming Logic) al lado de **TRAIN** (juegos) y **ASSESS**
(assessment), sin romper lo existente y con la misma disciplina: dominio puro, contenido verificado
por tests, TypeScript estricto, sin `any`, sin ejecutar código del usuario.

```text
                 PLATFORM
                    │
     ┌──────────────┼───────────────┐
     ↓              ↓               ↓
   TRAIN          LEARN           ASSESS
 GameEngine   LearningEngine  AssessmentEngine
     └──────────────┼───────────────┘
                    ↓
        shared kernel (domain/shared, random, time)
        + ProgressStore (versioned, per-slice)
        + Recommendation (Learn ↔ Train)
```

## 2. Por qué un motor separado (y no "una lección es un juego")

| Juego (existente)                            | Lección (nuevo)                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| Challenges **generados** por seed, infinitos | Contenido **escrito a mano**, finito, secuenciado pedagógicamente       |
| Mide rendimiento (precisión + velocidad)     | Mide **comprensión** (mastery por dimensión); el tiempo casi no importa |
| Límite de tiempo, puntos, rachas             | Sin límite de tiempo; reintentos permitidos con pistas                  |
| Una respuesta → siguiente                    | Explicación → ejemplo interactivo → ejercicio → feedback → práctica     |
| Resultado = `GameResult`                     | Resultado = actualización de `ConceptMastery` + desbloqueos + revisión  |

Forzar lecciones dentro de `SessionState` obligaría a añadir estados (`explaining`, `retrying`,
`hinted`) que los juegos no necesitan, y acoplaría el scoring de velocidad al aprendizaje. Se
**comparte infraestructura**, no la máquina de estados.

### Qué se reutiliza tal cual

- `domain/shared`: `Result`, `DomainError`, ids con brand, `CognitiveArea`, `ProgrammingSkill`.
- `domain/time/Clock` y `domain/random` (barajar opciones de forma determinista por seed, variantes
  de práctica parametrizadas).
- `domain/challenge/responseFormats`: `ChoiceOption` y la evaluación de `ordering`.
- Componentes de respuesta: `ChoiceResponse`, `OrderingResponse`, `NumericResponse` (con
  adaptaciones mínimas de props).
- Design system: `Button`, `Badge`, `ProgressBar`, `StatTile`, `PageHeader`, `AppShell`.
- Patrón de persistencia: puerto en dominio + adaptador localStorage + guards de datos no confiables.

### Qué se promueve a compartido (decisión arquitectónica — requiere aprobación)

- **Intérprete de pseudocódigo**: hoy vive en `games/algorithmic-logic/content/solvers/interpreter.ts`
  y solo maneja números. Propuesta: moverlo a `src/domain/pseudocode/` y extender los valores a
  `number | string | boolean` (necesario para `name = "Carlos"`, `active = true`). El juego de
  Logic lo reexporta, sin cambios de comportamiento. Uso en Learning: **verificar en los tests que
  cada respuesta de un ejercicio de predicción es la que produce el intérprete** — el contenido no
  puede contener un error de cálculo. Nunca ejecuta código escrito por el usuario.

## 3. Modelo de dominio (`src/domain/learning/`)

```ts
// Identidad
type CourseId = Brand<string, 'CourseId'>;
type ModuleId = Brand<string, 'ModuleId'>;
type LessonId = Brand<string, 'LessonId'>;
type ConceptId = Brand<string, 'ConceptId'>;
type ExerciseId = Brand<string, 'ExerciseId'>;

interface Course {
  id;
  title;
  modules: readonly Module[];
}
interface Module {
  id;
  title;
  summary;
  lessons: readonly Lesson[];
}

interface Concept {
  id: ConceptId;
  name: string; // "Conditions"
  prerequisites: readonly ConceptId[];
  /** Conexión con TRAIN: qué áreas cognitivas apoyan este concepto. */
  cognitiveLinks: readonly {
    area: CognitiveArea;
    gameId: string;
    level: DifficultyLevel;
    why: string;
  }[];
}

interface Lesson {
  id: LessonId;
  title: string;
  objective: string; // "Predict which branch a condition takes"
  concepts: readonly ConceptId[];
  steps: readonly LessonStep[]; // la secuencia pedagógica
  /** Condición de desbloqueo de la siguiente lección. */
  completion: { minMastery: number; dimensions: readonly MasteryDimension[] };
}

type LessonStep =
  | { kind: 'explain'; id; body: readonly RichBlock[] } // texto corto + código
  | { kind: 'playground'; id; playground: Playground } // ejemplo interactivo
  | { kind: 'exercise'; id; exercise: Exercise; stage: ExerciseStage };

/** understand → recognise → apply → debug → solve (Bloom simplificado, ver LEARNING_DESIGN). */
type ExerciseStage = 'understand' | 'recognise' | 'apply' | 'debug' | 'solve';
type MasteryDimension = 'understanding' | 'application' | 'debugging';
```

`RichBlock` es un árbol de datos (`paragraph | code | callout | list`) renderizado por React como
texto: **nunca HTML crudo ni `dangerouslySetInnerHTML`**.

### 3.1 Exercise (discriminated union)

```ts
type Exercise =
  | MultipleChoiceExercise // elegir una opción
  | PredictionExercise // "¿qué vale result?" — respuesta escrita o elegida
  | CodeCompletionExercise // rellenar huecos (cada hueco: opciones o valor)
  | OrderingExercise // ordenar instrucciones/bloques
  | BlockBuilderExercise // ordenar + descartar bloques distractores (Algorithm Builder)
  | MatchingExercise // emparejar (operador ↔ significado, valor ↔ tipo)
  | DebuggingExercise; // localizar la línea errónea + elegir la causa

interface ExerciseBase<K extends string> {
  id: ExerciseId;
  kind: K;
  prompt: string;
  concept: ConceptId;
  dimension: MasteryDimension;
  hints: readonly string[]; // reveladas progresivamente al fallar
  explanation: string; // por qué la respuesta correcta es correcta
}

interface MultipleChoiceExercise extends ExerciseBase<'multiple-choice'> {
  code?: CodeSnippet;
  options: readonly ChoiceOption[];
  correctOptionId: string;
  /** Feedback específico por distractor: el corazón del Feedback Engine. */
  misconceptions: Readonly<Record<string, string>>;
}

interface DebuggingExercise extends ExerciseBase<'debugging'> {
  code: CodeSnippet;
  buggyLine: number;
  causes: readonly ChoiceOption[]; // "¿por qué está mal?", no solo "¿dónde?"
  correctCauseId: string;
  misconceptions: Readonly<Record<string, string>>;
}
// … resto análogo; cada tipo declara exactamente su forma de respuesta.

type ExerciseAnswer =
  | { kind: 'multiple-choice'; optionId: string }
  | { kind: 'prediction'; value: string }
  | { kind: 'code-completion'; blanks: Readonly<Record<string, string>> }
  | { kind: 'ordering'; order: readonly string[] }
  | { kind: 'block-builder'; order: readonly string[] }
  | { kind: 'matching'; pairs: Readonly<Record<string, string>> }
  | { kind: 'debugging'; line: number; causeId: string };
```

### 3.2 Evaluación y Feedback Engine (puros)

```ts
interface Evaluation {
  verdict: 'correct' | 'partial' | 'incorrect';
  /** 0–1: permite crédito parcial (2 de 3 huecos, línea correcta con causa errónea). */
  credit: number;
  feedback: Feedback;
}

interface Feedback {
  headline: string;                  // "Incorrect."
  yourAnswer?: string;               // "You chose B."
  reasoning: readonly string[];      // 1–3 frases: "x = 10, so x > 5 is true…"
  correctAnswer?: string;            // "Correct answer: A."
  nextHint?: string;                 // si quedan pistas
}

evaluateExercise(exercise: Exercise, answer: ExerciseAnswer): Result<Evaluation, AnswerError>;
```

Reglas del feedback: el razonamiento se toma del distractor elegido (`misconceptions[optionId]`)
antes que de la explicación genérica; máximo ~3 frases; nunca solo "Incorrect". Un test de contenido
obliga a que **todo distractor tenga su misconception** redactada.

`prediction` normaliza la respuesta (espacios, comillas, `True`/`true`) antes de comparar; las
normalizaciones se documentan y se testean para evitar "respuestas ambiguas".

### 3.3 Mastery

```ts
interface ConceptMastery {
  conceptId: ConceptId;
  understanding: number; // 0–1
  application: number;
  debugging: number;
  attempts: number;
  lastPracticedAt: number;
}
```

Actualización: media móvil exponencial por dimensión, `m' = m + α·(credit − m)`, con α = 0.35 en el
primer intento y menor (0.15) si el usuario usó pistas o es un reintento, de forma que **hacer clic
hasta acertar no produce mastery**. Una lección se completa cuando cada dimensión exigida supera
`completion.minMastery` (p. ej. 0.7), no al pulsar "Complete".

### 3.4 Spaced repetition

```ts
interface ReviewItem {
  conceptId: ConceptId;
  box: 1 | 2 | 3 | 4 | 5;
  dueAt: number;
}
interface ReviewScheduler {
  schedule(item: ReviewItem, credit: number, now: number): ReviewItem;
}
```

Implementación inicial: **Leitner** (intervalos 1, 3, 7, 14, 30 días; acierto sube de caja, fallo
vuelve a la 1). Es un puerto (`ReviewScheduler`) para poder cambiar a SM-2/FSRS sin tocar el resto,
igual que `DifficultyStrategy` en los juegos.

### 3.5 Progreso, desbloqueos y persistencia

```ts
interface LearningProgress {
  schemaVersion: 1;
  lessons: Record<
    LessonId,
    { status: 'locked' | 'available' | 'in-progress' | 'completed'; completedAt?: number }
  >;
  mastery: Record<ConceptId, ConceptMastery>;
  reviews: Record<ConceptId, ReviewItem>;
}

interface LearningProgressRepository {
  get();
  save(p);
  clear();
} // puerto, como ProgressRepository
```

Desbloqueo = función pura `lessonStatus(course, progress)`: una lección está disponible cuando la
anterior está completada **o** sus conceptos prerequisito tienen mastery suficiente (permite a un
usuario con experiencia saltar mediante un mini-assessment, sin bloqueo artificial).

**Decisión:** clave de localStorage separada (`brain-practice:learning`) con su propio
`schemaVersion`. Un dato corrupto en Learning no debe borrar el progreso de los juegos ni al revés
(hoy el guard de progreso es todo-o-nada, ver auditoría P1-2).

## 4. Motor (`src/engine/LearningEngine.ts`)

Fachada con estado sobre un reducer puro `lessonReducer`, compatible con `useSyncExternalStore`
(mismo patrón que `GameSession`):

```text
lessonReducer: step(explain) → step(playground) → step(exercise: answering)
                                                    ├─ correct/partial → feedback → next step
                                                    └─ incorrect → feedback + hint → retry (máx. N)
               → summary (mastery Δ, desbloqueos, revisión programada, recomendación TRAIN)
```

API: `startLesson(lessonId)`, `submit(answer)`, `requestHint()`, `continue()`, `finish()` →
`LessonResult` que un caso de uso (`applyLessonResult`) aplica a `LearningProgress`.

## 5. Recomendaciones Learn ↔ Train (`src/domain/recommendation/`)

Función pura `recommendNext({ learning, games, now })` → lista ordenada y **explicada**:

1. Revisión vencida (`dueAt ≤ now`) → "Review: Conditions (2 min)".
2. Siguiente lección disponible.
3. Entrenamiento cognitivo vinculado al concepto actual (`Concept.cognitiveLinks`), al nivel
   sugerido del juego. Nunca bloqueante; siempre con el porqué ("Loops rely on tracking state
   across iterations — Code Memory L3 practises exactly that").

## 6. UI (`src/features/learn/`)

Rutas lazy: `/learn` (learning path), `/learn/:lessonId` (lección). Componentes: `LessonPlayer`,
`ExplainStep`, `PlaygroundStep`, un renderer por `Exercise['kind']` (switch exhaustivo, como los
`ContentView` de los juegos), `FeedbackPanel`, `MasteryMeter`, `CodeBlock`.

**Playgrounds sin ejecución arbitraria**: el usuario modifica _valores_ (sliders, campos tipados,
toggles) de un programa fijo; el resultado lo calcula el intérprete seguro sobre un AST conocido.
No hay `eval`, `Function` ni sandbox mientras no exista una estrategia de ejecución aislada
(iframe `sandbox` + worker o backend), documentada aparte.

## 7. Contenido: primer curriculum

Module 1 — **How Programs Think** (10 lecciones): What is a Program? · Instructions and Sequences ·
Values and Variables · Conditions · Logical Operators · Loops · Functions · Problem Decomposition ·
Algorithms · Debugging. Contenido en `src/content/programming-logic/` como datos tipados; cada
lección valida en tests: objetivo presente, ≥1 ejercicio por dimensión exigida, todas las respuestas
de predicción verificadas por el intérprete, todo distractor con misconception, IDs únicos, grafo de
prerequisitos acíclico.

## 8. Tests previstos

- Dominio: `evaluateExercise` por tipo (correct/partial/incorrect/respuesta inválida), mastery
  (monótona, acotada 0–1, reintentos pesan menos), Leitner, `lessonStatus` (desbloqueos).
- Motor: ciclo de vida completo de una lección, reintentos, pistas, doble envío rechazado.
- Persistencia: roundtrip, restauración, localStorage corrupto (se descarta solo el slice dañado).
- Integración (RTL): abrir lección → responder → ver feedback razonado → mastery sube → siguiente
  lección desbloqueada → persistido.
- Contenido: invariantes de §7 sobre todo el curriculum.

## 9. Fuera de alcance por ahora

Ejecución real de código, cuentas/backend, pagos, más de un módulo, editor de bloques con drag &
drop libre (se empieza con ordenar/descartar accesible por teclado, como `OrderingResponse`).
