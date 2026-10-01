# Learning Engine

Referencia técnica del pilar **LEARN**. La propuesta original (y sus alternativas) está en
[docs/learning-engine-proposal.md](docs/learning-engine-proposal.md); este documento describe lo
implementado. La pedagogía y el curriculum están en [LEARNING_DESIGN.md](LEARNING_DESIGN.md).

## Piezas

```text
content/programming-logic/        datos: concepts.ts, course.ts, lessons/01…10
        │  (validados por validateCourse en course.test.ts)
        ▼
domain/learning/                  puro
  content.ts       Course → Module → Lesson → LessonStep (explain | playground | exercise)
  exercise.ts      Exercise (7 tipos, discriminated union) + ExerciseAnswer
  evaluate.ts      Feedback Engine: evaluateExercise() → Evaluation { verdict, credit, feedback }
  lessonSession.ts lessonReducer: máquina de estados de una lección/repaso
  mastery.ts       ConceptMastery, effectiveCredit, updateMastery
  review.ts        ReviewScheduler (puerto) + leitnerScheduler
  progress.ts      LearningProgress, applyLessonResult, applyReviewResult, lessonStatus, courseProgress
  reviewPlan.ts    planReview(): ejercicios para los conceptos con repaso vencido
  validateCourse.ts invariantes de contenido (ejecuta cada respuesta)
domain/pseudocode/                parser + intérprete seguro
engine/LessonSession.ts           fachada con estado (+ Clock, subscribe)
features/learn/                   LearnPage, LessonPage, ReviewPage, LessonPlayer, vistas de ejercicio
infrastructure/LocalStorageLearningRepository.ts   slice `brain-practice:learning`
```

## Pseudocódigo (`domain/pseudocode`)

Lenguaje docente neutral (superficie tipo Python): números, texto, `true/false`, `none`, listas;
`if/elif/else`, `while`, `for x in lista|range()`, `function f(a, b):` + `return`, `print`, y
`len, range, append, str, abs, max, min`. Bloques por indentación con espacios.

- `parseProgram(source)` → `Result<Program, ParseError>` con línea y mensaje para principiantes.
- `runProgram(program, { inputs, limits })` → `{ variables, output, trace, steps, error }`.
  Los errores de ejecución (variable sin valor, texto + número, índice fuera de rango, bucle sin fin,
  recursión excesiva) **no lanzan**: se devuelven en `error`, porque encontrarlos es parte de lo que se
  enseña. `trace` guarda línea + variables tras cada paso (máx. 400) para el paso a paso.
- Seguridad: nada llega al motor de JavaScript. Las búsquedas de nombres usan `Map`/`Object.hasOwn`, así
  que `constructor`, `toString` o `__proto__` son nombres desconocidos, no puertas al host (testeado).
- Límites: 5000 pasos, profundidad 40.

## Ejercicios y Feedback Engine

| Tipo              | Respuesta              | Crédito parcial                                      |
| ----------------- | ---------------------- | ---------------------------------------------------- |
| `multiple-choice` | opción                 | no                                                   |
| `prediction`      | texto (valor o salida) | no; normalización tolerante de forma (ver abajo)     |
| `code-completion` | valor por hueco        | fracción de huecos correctos                         |
| `ordering`        | permutación            | 0,5 si ≥ 60 % de pasos en su sitio                   |
| `block-builder`   | subconjunto ordenado   | 0,5 si solo falla el orden (LCS ≥ n − 1, sin extras) |
| `matching`        | pares                  | fracción si ≥ 50 %                                   |
| `debugging`       | línea + causa          | 0,5 si una de las dos es correcta                    |

`Feedback = { headline, yourAnswer, diagnosis[], explanation, correctAnswer }`. El **diagnóstico**
explica la respuesta del alumno (misconception del distractor elegido, error típico de predicción,
"la línea no es esta, pero tu razón es correcta"); la **explicación** y la **respuesta correcta**
revelan la solución y la UI solo las muestra cuando el ejercicio es final.

Predicción: `canonicalValue` unifica comillas, quita espacios fuera de texto y normaliza números y
`true/false/none`; un texto esperado acepta la respuesta con o sin comillas. La salida se compara
línea a línea. Las mayúsculas dentro de un texto sí importan.

## Ciclo de una lección (`lessonReducer`)

```text
explain/playground ──continue──▶ siguiente paso
exercise: answering ──submit──▶ feedback(final = correcto || sin intentos)
          answering ──hint───▶ answering (+1 pista, penaliza ×0,8)
          feedback  ──retry──▶ answering (desbloquea la siguiente pista)   [si !final]
          feedback  ──reveal─▶ feedback(final, revealed)                    [si no es correcto]
          feedback  ──continue─▶ registra ExerciseOutcome → siguiente paso
último paso ──continue──▶ terminado → lessonResultOf()
```

Intentos por fase: `guided` 3, `practice` 2, `checkpoint` 1 (sin pistas). Envíos dobles, saltos sin
responder y eventos tras terminar son errores `Result`, nunca se ignoran.

## Puntuación, mastery y desbloqueo

- `effective = credit × 0,5^(intentos−1) × 0,8^(pistas pedidas)`; revelar = 0.
- Puntuación de lección = media ponderada de `effective` (checkpoint ×2). **Superada si ≥ 0,6.**
- `ConceptMastery` por dimensión (`understanding`, `application`, `debugging`):
  `m' = m + 0,4 · (effective − m)`. Dominada a partir de 0,75.
- `lessonStatus`: la primera lección y las ya intentadas están abiertas; las demás se abren al superar
  la anterior. Las completadas se pueden repetir siempre (se conserva la mejor puntuación y la primera
  fecha de compleción).

## Repetición espaciada

Leitner con cajas 1–5 e intervalos de 1, 3, 7, 14 y 30 días (`ReviewScheduler` es un puerto: se puede
cambiar a SM-2/FSRS). Superar una lección programa el primer repaso de sus conceptos a 1 día. Un repaso
(`/learn/review`) toma hasta 4 conceptos vencidos y 2 ejercicios por concepto de lecciones ya
superadas (dimensión más débil primero, plan determinista por día); media ≥ 0,7 sube de caja, si no
vuelve a la 1.

## Persistencia

`LearningProgress { schemaVersion: 1, lessons, mastery, reviews }` en su propia clave, con
`recoverLearningProgress` (recuperación por entrada) y `LEARNING_MIGRATIONS`. Un dato corrupto de
aprendizaje no toca el progreso de los juegos.

## Añadir contenido

1. Crear `src/content/<curso>/lessons/NN-slug.ts` exportando `lesson: Lesson`.
2. Añadirlo a `course.ts`; reutilizar o añadir conceptos en `concepts.ts` (cada uno con al menos un
   `cognitiveLink`).
3. `npx vitest run src/content -t "<lesson-id>"`: `validateLesson` exige explicación inicial,
   playground, ≥ 5 ejercicios de ≥ 3 tipos, las tres dimensiones, checkpoint al final, pistas en los
   guiados, misconception para cada distractor, y **ejecuta** cada predicción, cada código completado
   (y comprueba que ninguna opción incorrecta también funciona) y cada bug + su fix (que solo cambia la
   línea del bug).

## Fuera de alcance (deliberadamente)

Ejecutar código escrito por el usuario. El playground solo cambia _valores de entrada_ de un programa
fijo. Un futuro editor libre necesitará aislamiento (Worker + iframe `sandbox` o servidor).
