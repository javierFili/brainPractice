# Game Design

Punto de entrada al diseño de juegos y niveles de BrainPractice. Este documento resume los principios
comunes, la estructura de niveles y el diseño de cada juego y del Cognitive Assessment; el detalle de
cada juego (catálogos, garantías de unicidad, distractores, invariantes) está en
[`docs/game-design/`](docs/game-design/).

**Conexión con LEARN:** cada concepto de Programming Logic enlaza los juegos y niveles que practican la
habilidad que exige (`cognitiveLinks`, ver [LEARNING_DESIGN.md](LEARNING_DESIGN.md)); los resultados de
cada juego muestran a su vez las lecciones relacionadas. Los juegos de elección múltiple tienen
**invariantes de medición** (`__tests__/measurement.test.ts`): la respuesta no puede adivinarse por la
forma de las opciones ni por su posición.

**Fuente de verdad:** los perfiles de nivel de `src/games/<id>/content/levels.ts`. Las tablas de este
documento y de los documentos detallados los resumen; si alguna vez difieren, manda `levels.ts`.

> BrainPractice es entrenamiento recreativo y autoevaluación. Las puntuaciones describen únicamente el
> rendimiento en estos ejercicios: no es un test de IQ ni una evaluación psicométrica o clínica.

## Principios de diseño de contenido

- **Un objetivo cognitivo por challenge.** Cada tipo de challenge (`kind`) entrena una operación mental
  concreta (ordenar dependencias, recordar un campo, localizar un token cambiado…), y cada nivel declara
  su propósito en `objective`, que se muestra en la intro del juego.
- **Una única respuesta, verificada por un oráculo independiente.** Los generadores construyen el
  challenge y un solver de `content/solvers/` comprueba que existe exactamente una respuesta correcta;
  si no, `retryGeneration` descarta el candidato y lo regenera desde el mismo flujo con seed. Los tests
  vuelven a verificar la unicidad con oráculos que no reutilizan la decisión del generador (fuerza
  bruta, intérpretes, comprobadores de reglas escritos aparte). Ver [TESTING.md](TESTING.md).
- **Distractores plausibles basados en errores típicos.** Las opciones incorrectas salen de errores
  reales de programación y de razonamiento (ignorar una dependencia, off-by-one, evaluar una condición
  al revés, leer un valor viejo, confundir PK con FK, near misses que encajan con todos los ejemplos
  menos uno), nunca de valores aleatorios sin sentido, y son siempre distintas entre sí y de la
  solución.
- **La explicación contiene la respuesta.** Tras cada respuesta, el feedback explica por qué la
  solución es correcta y la nombra explícitamente (lo comprueban los tests de contenido).
- **Dificultad multidimensional, no "números grandes".** Los números se mantienen pequeños; la dificultad
  crece a la vez en varios ejes (tamaño, anidación, interferencia, sutileza, composición, evidencia
  disponible, tiempo) y, en los tramos altos, aparecen **tipos de razonamiento nuevos** en lugar de más
  de lo mismo. Ninguna dimensión decrece al subir de nivel salvo cambios de `kinds` documentados.
- **Neutralidad de lenguaje.** El material tiene sabor a código (pseudocódigo, logs, registros, llamadas
  a APIs, grafos de módulos) pero no presupone ningún lenguaje de programación ni algoritmo con nombre.
  Las operaciones se describen con palabras y sin trucos tipográficos.

### Habilidades de programación

Cada juego declara en su `GameDefinition` (`skills`) las habilidades de pensamiento de programación que
entrena, tomadas del vocabulario común `PROGRAMMING_SKILLS` (`src/domain/shared/programmingSkill.ts`):

| Habilidad              | Algorithmic Logic | Code Memory | Code Scan | Bug Hunter | Pattern Architect |
| ---------------------- | :---------------: | :---------: | :-------: | :--------: | :---------------: |
| `decomposition`        |         ✓         |             |           |            |         ✓         |
| `abstraction`          |                   |             |           |     ✓      |         ✓         |
| `pattern-recognition`  |                   |             |     ✓     |     ✓      |         ✓         |
| `logical-reasoning`    |         ✓         |      ✓      |           |            |                   |
| `working-memory`       |         ✓         |      ✓      |           |            |                   |
| `attention`            |                   |      ✓      |     ✓     |     ✓      |                   |
| `debugging`            |                   |             |     ✓     |     ✓      |                   |
| `algorithmic-thinking` |         ✓         |      ✓      |           |            |         ✓         |

Los documentos detallados describen además en qué tipos de challenge se ejercita cada habilidad.

## Estructura de niveles común

Todos los juegos tienen **exactamente 10 niveles** (`LevelTable`), todos abiertos desde el principio,
agrupados en cuatro tramos (`tier`):

| Tramo          | Niveles | Qué significa                                                                                                                                                                                                                                                               |
| -------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fundamentals` | 1–3     | Presenta los tipos de challenge básicos de cada juego con material pequeño, una sola regla o regularidad y violaciones o cambios evidentes. Sesiones cortas (6 challenges; 8 en Code Scan).                                                                                 |
| `intermediate` | 4–6     | Respuestas exactas en lugar de opciones (trazas numéricas en Algorithmic Logic y Code Memory), composición de reglas y condiciones, interferencia (elementos parecidos) y dos reglas simultáneas. Sesiones de 8 challenges (10 en Code Scan).                               |
| `advanced`     | 7–8     | Entran tipos de razonamiento nuevos (camino crítico, búsquedas cruzadas, clasificar el cambio, estructura sobre contenido, tres reglas a la vez) con más carga y señuelos.                                                                                                  |
| `expert`       | 9–10    | Máxima carga e interferencia con la mínima evidencia o el menor tiempo, y razonamientos de dos pasos (joins, planificación ponderada, señuelos que conservan grados, localizar y clasificar sin pista). Difícil pero justo: sigue habiendo una única respuesta verificable. |

`timing` fija por nivel el límite (`limitMs`), el tiempo objetivo (`targetMs`, que marca el ritmo en el
scoring) y, solo en Code Memory, la fase de estudio (`studyMs`). Ver [GAME_ENGINE.md](GAME_ENGINE.md).

## Algorithmic Logic

**Área** `logic` · **id** `algorithmic-logic` · detalle en
[docs/game-design/algorithmic-logic.md](docs/game-design/algorithmic-logic.md)

Entrena la deducción, el razonamiento condicional, el análisis de dependencias y el pensamiento
algorítmico. No es aritmética: los valores se mantienen en |valor| ≤ 150 y la dificultad viene de la
estructura de grafos, programas y reglas.

Tipos de challenge:

- `dependency-order` (L1–7, L9): elegir el único orden de ejecución que respeta un grafo de dependencias.
- `dependency-count` (L5–8, L10): contar todos los módulos que deben terminar antes de un objetivo (numérica).
- `program-trace` (L1–10): valor final de una variable tras ejecutar pseudocódigo (opciones en L1–3, numérica desde L4).
- `constraint-arrangement` (L3–10): puzzle de despliegue con reglas de posición; verificar el orden o deducir una posición.
- `critical-path` (L8–10): rondas mínimas con ejecución en paralelo ilimitada (duraciones ponderadas en L9–10).

| Nivel | Objetivo                                                       | Límite / objetivo | Retos | Grafo (nodos / dependencias) | Programa (variables / bloques) | Restricciones (servicios, pregunta) |
| ----- | -------------------------------------------------------------- | ----------------- | ----- | ---------------------------- | ------------------------------ | ----------------------------------- |
| 1     | Dependencias simples y asignaciones en línea recta             | 90 s / 30 s       | 6     | 4 / 3, obvias                | 2 / 2, asignaciones            | —                                   |
| 2     | Ramificación: seguir solo la rama seleccionada                 | 90 s / 35 s       | 6     | 5 / 4, obvias                | 2 / 3, `if`                    | —                                   |
| 3     | Órdenes casi correctos y primeros puzzles de restricciones     | 120 s / 45 s      | 6     | 5 / 5, sutiles               | 3 / 3, `swap`                  | 4, verificar orden                  |
| 4     | Condiciones compuestas y respuestas exactas                    | 120 s / 50 s      | 8     | 6 / 6                        | 3 / 4, `and/or/not`, numérica  | 4, deducir posición                 |
| 5     | Bucles y dependencias transitivas                              | 150 s / 55 s      | 8     | 7 / 8                        | 3 / 4, `repeat`                | 5, verificar orden                  |
| 6     | Condiciones dentro de bucles                                   | 150 s / 65 s      | 8     | 8 / 10                       | 3 / 5, `repeat` + `if`         | 5, deducir posición                 |
| 7     | Bucles abiertos y cadenas de deducción con seis servicios      | 180 s / 75 s      | 8     | 9 / 12                       | 4 / 5, `while`                 | 6, deducir posición                 |
| 8     | Planificación en paralelo: la cadena que limita el build       | 180 s / 85 s      | 8     | 9 / 11                       | 4 / 6                          | 6, deducir (solo reglas débiles)    |
| 9     | Planificaciones ponderadas, bucles anidados, pistas débiles    | 210 s / 95 s      | 8     | 10 / 13, ponderado           | 4 / 6, `repeat` anidado        | 7, deducir posición                 |
| 10    | Todo a la vez: grafos grandes, trazas largas, pistas relativas | 240 s / 110 s     | 8     | 12 / 16, ponderado           | 4 / 7                          | 7, deducir (solo reglas relativas)  |

## Code Memory

**Área** `memory` · **id** `code-memory` · detalle en
[docs/game-design/code-memory.md](docs/game-design/code-memory.md)

Entrena la memoria de trabajo, secuencial y contextual que se usa al mantener en la cabeza una
estructura de datos o una traza. Cada challenge tiene una fase de estudio (el material se ve, la
pregunta no) y una fase de respuesta en la que el material desaparece.

Tipos de challenge:

- `record-recall` (L1–8): recordar un campo concreto de un registro concreto.
- `sequence-recall` (L1–10): orden de llamadas tipo API (posición, sucesor o reconstrucción completa con `ordering`).
- `variable-state` (L2–10): valor de una variable tras una serie de asignaciones (numérica desde L4; tras una línea concreta desde L7).
- `position-recall` (L1–10): dónde estaba una keyword en una cuadrícula (`locate`).
- `cross-reference` (L7–10): localizar un registro por un campo y recordar otro.
- `foreign-key-join` (L9–10): seguir una foreign key entre dos tablas que ya no se ven.

| Nivel | Objetivo                                                      | Estudio máx · límite / objetivo | Retos | Records × campos | Llamadas | Líneas / variables | Grid (keywords) | Distractores | Join  |
| ----- | ------------------------------------------------------------- | ------------------------------- | ----- | ---------------- | -------- | ------------------ | --------------- | ------------ | ----- |
| 1     | Retener unos pocos campos, llamadas y posiciones              | 15 s · 60 s / 10 s              | 6     | 1 × 3            | 4        | — (no activo)      | 3×3 (5)         | 3            | —     |
| 2     | Separar dos registros y seguir una variable                   | 15 s · 60 s / 10 s              | 6     | 2 × 3            | 5        | 3 / 2              | 3×3 (6)         | 3            | —     |
| 3     | Qué siguió a qué; posiciones en una cuadrícula mayor          | 16 s · 60 s / 12 s              | 6     | 2 × 4            | 5        | 4 / 2              | 4×4 (7)         | 3            | —     |
| 4     | Respuestas exactas con tres variables                         | 18 s · 75 s / 14 s              | 8     | 3 × 4            | 6        | 5 / 3              | 4×4 (8)         | 4            | —     |
| 5     | Interferencia: ids y keywords parecidos; reconstruir el orden | 18 s · 75 s / 15 s              | 8     | 3 × 4            | 6        | 5 / 3              | 4×4 (9)         | 4            | —     |
| 6     | Llamadas similares sobre los mismos recursos                  | 20 s · 90 s / 18 s              | 8     | 3 × 5            | 7        | 6 / 3              | 4×4 (10)        | 4            | —     |
| 7     | Buscar registros por otro campo; estado tras una línea        | 20 s · 90 s / 20 s              | 8     | 4 × 5            | 7        | 6 / 3              | 5×5 (11)        | 5            | —     |
| 8     | Cuatro registros, cuatro variables y ocho llamadas a la vez   | 22 s · 90 s / 22 s              | 8     | 4 × 5            | 8        | 7 / 4              | 5×5 (13)        | 5            | —     |
| 9     | Joins: seguir una foreign key entre dos tablas ocultas        | 22 s · 120 s / 24 s             | 8     | 5 × 5            | 9        | 8 / 4              | 5×5 (15)        | 5            | 3 + 3 |
| 10    | Máxima carga e interferencia con el menor estudio por ítem    | 24 s · 120 s / 25 s             | 8     | 5 × 6            | 10       | 9 / 4              | 5×5 (18)        | 5            | 4 + 4 |

El tiempo de estudio de cada challenge es proporcional a lo que muestra (`perItemMs` baja de 1,5 s en
L1 a 0,85 s en L10) y la columna "Estudio máx" es su tope. La similitud entre valores pasa a alta desde
L5 y las llamadas similares aparecen desde L6.

## Code Scan

**Área** `speed` · **id** `code-scan` · detalle en
[docs/game-design/code-scan.md](docs/game-design/code-scan.md)

Entrena la velocidad de procesamiento aplicada a código: comparar dos snippets casi idénticos
(ORIGINAL y COPY) y detectar el único token que cambió, como al revisar un diff. Se pide velocidad sin
renunciar a la precisión; por eso usa un override de scoring (`maxSpeedBonus: 1`, `accuracyWeight: 0.6`).

Tipos de challenge:

- `same-or-different` (L1–6, L9–10): decidir si los dos snippets son idénticos (2 opciones).
- `find-the-change` (L2–10): señalar la línea de la copia que cambió (`locate`).
- `classify-the-change` (L7–10): nombrar la categoría del cambio entre cinco (con la línea señalada en L7–8, sin pista en L9–10).

| Nivel | Objetivo                                                        | Límite / objetivo | Retos | Líneas | Complejidad | Ruido visual | Cambios finos | Categorías de cambio           |
| ----- | --------------------------------------------------------------- | ----------------- | ----- | ------ | ----------- | ------------ | ------------- | ------------------------------ |
| 1     | Decidir si dos snippets cortos son idénticos                    | 20 s / 8 s        | 8     | 4      | 1           | 0            | 0             | operator, variable, number     |
| 2     | Señalar la línea exacta que cambió; entran los typos            | 18 s / 8 s        | 8     | 5      | 1           | 0,1          | 0,2           | + typo                         |
| 3     | Condiciones negadas y cambios de un carácter                    | 18 s / 9 s        | 8     | 6      | 1           | 0,2          | 0,35          | + negation (catálogo completo) |
| 4     | Bloques anidados y condiciones compuestas                       | 16 s / 9 s        | 10    | 7      | 2           | 0,3          | 0,5           | todas                          |
| 5     | Runs de líneas parecidas: comparar token a token                | 16 s / 9 s        | 10    | 8      | 2           | 0,4          | 0,6           | todas                          |
| 6     | Listados más largos con menos tiempo                            | 15 s / 9 s        | 10    | 9      | 2           | 0,5          | 0,7           | todas                          |
| 7     | Nombrar el tipo de cambio                                       | 14 s / 8 s        | 10    | 9      | 2           | 0,55         | 0,75          | todas (línea señalada)         |
| 8     | Clasificar cambios finos entre líneas parecidas, más rápido     | 14 s / 8 s        | 10    | 10     | 2           | 0,6          | 0,8           | todas (línea señalada)         |
| 9     | Encontrar y clasificar el cambio sin pista                      | 13 s / 8 s        | 10    | 11     | 2           | 0,7          | 0,85          | todas                          |
| 10    | Doce líneas densas y un cambio de un carácter, a toda velocidad | 12 s / 7 s        | 10    | 12     | 2           | 0,8          | 0,9           | todas                          |

"Ruido visual" es la probabilidad de que el cambio caiga dentro de una run de líneas casi idénticas y
"Cambios finos", la proporción de variantes finas (p. ej. `<` ↔ `<=`, ±1) frente a gruesas.

## Bug Hunter

**Área** `attention` · **id** `bug-hunter` · detalle en
[docs/game-design/bug-hunter.md](docs/game-design/bug-hunter.md)

Entrena la atención selectiva y sostenida y la detección de anomalías: un artefacto (log, registros o
pseudocódigo), unas reglas explícitas y muchos elementos parecidos, de los que exactamente uno rompe
exactamente una regla. El jugador lo señala (`locate`); los near misses legales castigan responder por
lo que "parece raro" en lugar de por las reglas enunciadas.

Tipos de challenge:

- `sequence-anomaly` (L1–10): la línea de log que rompe un patrón secuencial (`time` ascendente, `seq` +1, `req` único).
- `schema-violation` (L1–10): el registro que incumple una restricción de campo del esquema.
- `code-rule` (L2–10): la línea de pseudocódigo que rompe una regla (asignar antes de leer, camelCase, abrir/cerrar recursos).
- `multi-rule` (L5–10): varias familias de reglas a la vez, incluida una condicional entre campos.

| Nivel | Objetivo                                                               | Límite / objetivo | Retos | Elementos | Reglas simultáneas | Ruido | Señuelos | Violación |
| ----- | ---------------------------------------------------------------------- | ----------------- | ----- | --------- | ------------------ | ----- | -------- | --------- |
| 1     | Una regla y una lista corta, elemento a elemento                       | 60 s / 20 s       | 6     | 6         | 1                  | 0     | 1        | obvia     |
| 2     | Leer pseudocódigo como datos                                           | 75 s / 25 s       | 6     | 8         | 1                  | 1     | 2        | obvia     |
| 3     | Bugs sutiles: typos, off-by-one, segundos fuera de orden               | 90 s / 32 s       | 6     | 10        | 1                  | 1     | 3        | sutil     |
| 4     | Dos reglas; recursos que hay que abrir y cerrar                        | 110 s / 42 s      | 8     | 14        | 2                  | 1     | 4        | sutil     |
| 5     | Familias de reglas mezcladas                                           | 130 s / 52 s      | 8     | 18        | 2                  | 2     | 6        | sutil     |
| 6     | Artefactos más largos con más señuelos                                 | 150 s / 62 s      | 8     | 22        | 2                  | 2     | 8        | sutil     |
| 7     | Tres reglas por elemento, incluida una condicional                     | 170 s / 75 s      | 8     | 26        | 3                  | 3     | 10       | sutil     |
| 8     | Artefactos densos donde casi todo lo sospechoso es legal               | 190 s / 85 s      | 8     | 30        | 3                  | 3     | 12       | sutil     |
| 9     | Atención sostenida: tres reglas sobre tres docenas de elementos        | 220 s / 100 s     | 8     | 36        | 3                  | 4     | 15       | sutil     |
| 10    | Todo a la vez: 42 elementos, ruido alto y near misses por todas partes | 250 s / 115 s     | 8     | 42        | 3                  | 4     | 20       | sutil     |

"Ruido" es el número de campos sin regla por elemento (`visualNoise`) y "Señuelos", el número de
valores inusuales pero legales (`distractors`).

## Pattern Architect

**Área** `patterns` · **id** `pattern-architect` · detalle en
[docs/game-design/pattern-architect.md](docs/game-design/pattern-architect.md)

Entrena el reconocimiento de patrones, la abstracción y la generalización: encontrar la regla que
explica toda la evidencia y aplicarla a un caso nuevo. La dificultad crece por composición (de una
regla a tres operaciones encadenadas), por abstracción (de regularidades visibles a programas ocultos
y estructuras sin nombres) y por mostrar menos ejemplos. Todas las respuestas son de opción única
(1 correcta + 3 distractores).

Tipos de challenge:

- `number-sequence` (L1–6): dar el siguiente término de una secuencia numérica.
- `symbol-grid` (L1–6): completar la celda que falta de una cuadrícula de símbolos (formas y cantidades con reglas independientes).
- `transform-inference` (L4–10): inferir un programa oculto de 1–3 pasos sobre listas a partir de ejemplos entrada → salida.
- `structure-match` (L7–10): elegir el grafo con la misma estructura de conexiones que el de referencia.
- `tree-analogy` (L7–10): `A → A′` como `C → ?` sobre árboles ordenados.

| Nivel | Objetivo                                                           | Límite / objetivo | Retos | Abstracción | Complejidad | Secuencia (términos) | Cuadrícula       | Programa (pasos, ≤ ejemplos)  | Grafo (nodos / flechas)    | Árbol (operaciones, ≤ ejemplos) |
| ----- | ------------------------------------------------------------------ | ----------------- | ----- | ----------- | ----------- | -------------------- | ---------------- | ----------------------------- | -------------------------- | ------------------------------- |
| 1     | Detectar una regularidad simple                                    | 60 s / 20 s       | 6     | 1           | 1           | 5                    | 3×3, 1 atributo  | —                             | —                          | —                               |
| 2     | Pasos que cambian; dos atributos con reglas separadas              | 75 s / 25 s       | 6     | 1           | 2           | 5                    | 3×3, 2 atributos | —                             | —                          | —                               |
| 3     | Secuencias intercaladas; cantidades aritméticas                    | 90 s / 30 s       | 6     | 2           | 2           | 6                    | 3×3              | —                             | —                          | —                               |
| 4     | Inferir un programa oculto de un paso                              | 90 s / 35 s       | 8     | 2           | 2           | 7                    | 4×4              | 1, ≤ 3                        | —                          | —                               |
| 5     | Programas de dos pasos encadenados                                 | 120 s / 45 s      | 8     | 3           | 2           | 7                    | 4×4              | 2, ≤ 4                        | —                          | —                               |
| 6     | Pasos que dependen de los datos, con menos ejemplos                | 120 s / 50 s      | 8     | 3           | 2           | 7                    | 4×4              | 2, ≤ 3 (vocabulario completo) | —                          | —                               |
| 7     | Estructura sobre contenido: grafos y árboles                       | 150 s / 60 s      | 8     | 4           | 2           | —                    | —                | 2, ≤ 3                        | 5 / 5, `rewire`            | 1, ≤ 2                          |
| 8     | Programas de tres pasos, grafos mayores, árbol con un ejemplo      | 180 s / 75 s      | 8     | 4           | 3           | —                    | —                | 3, ≤ 4 (vocabulario básico)   | 6 / 7, `rewire`            | 1, 1                            |
| 9     | Grafos parecidos con los mismos grados; reglas de árbol compuestas | 210 s / 90 s      | 8     | 5           | 3           | —                    | —                | 3, ≤ 4                        | 6 / 7, `degree-preserving` | 2, ≤ 2                          |
| 10    | Evidencia mínima en todo                                           | 240 s / 100 s     | 8     | 5           | 3           | —                    | —                | 3, ≤ 3                        | 7 / 9, `degree-preserving` | 2, ≤ 2                          |

## Cognitive Assessment

El **Programming Cognitive Assessment** (`src/games/assessment.ts`, id
`programming-cognitive-assessment-v1`) combina los cinco juegos en una sola batería y produce un
perfil de rendimiento (Programming Cognitive Index / Performance Profile).

- **Batería:** las 5 áreas (logic, memory, speed, attention, patterns) × los niveles **2, 5 y 8** (uno de
  cada tramo fundamentals, intermediate y advanced) × **2 challenges** por nivel = 30 challenges. Cada
  par (área, nivel) se juega como una sesión corta normal del `GameEngine`; no existe un segundo bucle
  de juego.
- **Puntuación ponderada por dificultad:** la puntuación de cada área es
  `Σ m(L)·PI(L) / Σ m(L)`, con `m(L) = 1 + 0.25·(L − 1)` (el mismo multiplicador del scoring: 1,25 en L2,
  2 en L5 y 2,75 en L8) y `PI` el índice de rendimiento de la sesión. La evidencia en niveles altos pesa
  más. **Los challenges saltados cuentan como no resueltos** (`PI' = PI · attempted / total`): saltar
  nunca sube la puntuación. Un área saltada entera vale 0 y sigue contando en el índice global
  (`overall`), que es la media de las áreas de la batería; `null` solo significa que la batería no
  incluye esa área. Un assessment sin ninguna respuesta no se guarda.
- **Precisión:** cada puntuación lleva su número de ítems y un margen aproximado del 95 %
  (`98 / √items`: ±40 con 6 ítems por área, ±18 en el global). La UI lo muestra y pide leer el
  resultado como orientación, no como medida precisa.
- **Bandas** (escala 0–100): < 40 `developing`, 40–59 `solid`, 60–79 `strong`, ≥ 80 `exceptional`
  (mostrada como "Very strong").
- **Las rondas no cuentan como récords:** dos challenges por nivel son muy poca evidencia para
  "superar" un nivel, así que las rondas del assessment no se guardan como sesiones ni récords de nivel;
  solo se guarda un `AssessmentSummary` con el perfil.
- **Aviso:** las puntuaciones describen precisión y ritmo en estos ejercicios (los niveles difíciles
  pesan más), no se comparan con normas poblacionales. Es
  una herramienta recreativa: no es un test de IQ ni un instrumento psicométrico o clínico, y la UI lo
  indica explícitamente.

## Cómo añadir o modificar niveles

1. Edita el perfil en `src/games/<id>/content/levels.ts` (la única tabla que consume el generador):
   `objective`, `challengeCount`, `timing` y los parámetros del juego.
2. Mantén los invariantes que comprueban los tests del juego: las dimensiones no decrecen, el objetivo
   es ≤ el límite y cada tipo aparece solo en sus niveles.
3. Actualiza la tabla del nivel en el documento detallado `docs/game-design/<id>.md` y en este documento.
4. Ejecuta `npm test`; `createGameRegistry` además valida la tabla de niveles al arrancar.

Los pasos completos para añadir niveles, tipos de challenge o juegos están en
[CONTRIBUTING.md](CONTRIBUTING.md).
