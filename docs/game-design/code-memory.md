# Code Memory — diseño del juego

> Área: **memory** · id: `code-memory` · código en `src/games/code-memory/`

## Propósito

Programar exige sostener información en la cabeza mientras se razona: los campos de un objeto que
se acaba de inspeccionar, el orden de las llamadas de un log, el valor que tiene una variable a mitad
de una traza, o qué fila de una tabla apunta a cuál otra. **Code Memory** entrena esa memoria de
trabajo con material con sabor a código pero **neutral respecto al lenguaje** (sin sintaxis de
JavaScript, Python, etc.).

Cada challenge tiene dos momentos:

1. **Estudio** (`timing.studyMs` nunca es `null`): se muestra el material. La pregunta está oculta,
   así que el jugador no sabe qué se le va a preguntar y tiene que codificarlo todo.
2. **Respuesta**: el material desaparece (placeholder "Hidden — answer from memory"; en las
   preguntas de posición, una cuadrícula vacía de celdas clicables) y aparece la pregunta.

En la **revisión** el material vuelve a mostrarse con el elemento preguntado resaltado (color +
texto: "← asked", "✓ answer", "(key)", "(link)"…) para que el jugador aprenda de su error.

## Habilidades de pensamiento de programación

Habilidades principales declaradas en la definición del juego (las que muestra el catálogo): `working-memory`, `attention`, `algorithmic-thinking` y `logical-reasoning`. La tabla detalla también habilidades secundarias que se ejercitan en tipos concretos.

| Habilidad              | Dónde se entrena                                                              |
| ---------------------- | ----------------------------------------------------------------------------- |
| `working-memory`       | Todos los tipos: retener datos exactos sin verlos.                            |
| `attention`            | Records y cuadrículas: distinguir valores y keywords casi idénticos.          |
| `algorithmic-thinking` | Secuencias de llamadas y estado de variables: orden y efecto de cada paso.    |
| `debugging`            | Estado de variables: el error típico de traza (update olvidado, valor viejo). |
| `logical-reasoning`    | Cross-reference y joins: localizar por un campo y leer otro.                  |
| `decomposition`        | Joins: dividir la pregunta en dos búsquedas encadenadas.                      |

## Tipos de challenge

La interferencia y los distractores se construyen siempre **con lo que el jugador realmente vio**
primero (valores de otros registros, llamadas vecinas, otras variables) y solo después con valores
cercanos plausibles. `singleChoice` rechaza etiquetas duplicadas, así que nunca hay dos opciones
iguales, y los tests recalculan la respuesta de forma independiente y comprueban que **solo una**
opción coincide con ella.

### `record-recall` — Record recall (L1–8)

- **Objetivo**: recordar un campo concreto de un registro concreto.
- **Ejemplo**: `Order { id: 482, status: PAID, total: 245 }`, `User { id: 428, name: Mira, role:
AUDITOR }` → _"What was the id of the Order record?"_ → `482`.
- **Unicidad**: todos los registros de un challenge tienen **tipos distintos**, así que "the Order
  record" identifica exactamente uno; se pregunta un campo que el registro muestra y nunca un
  booleano (dos valores serían una moneda al aire).
- **Distractores**: primero el mismo campo en otros registros (p. ej. los otros `id`), luego valores
  cercanos del dominio: permutaciones de dígitos y ±1/±10 para ids, pasos vecinos para enteros, otros
  valores del enum, nombres de la misma familia (`Mara/Maria/Marta`). Con similitud alta (L5+) los
  ids de todos los registros son **permutaciones de los mismos tres dígitos** y los nombres
  pertenecen a una misma familia.

### `sequence-recall` — Call sequences (L1–10)

- **Objetivo**: memoria secuencial (orden) de llamadas tipo API.
- **Ejemplo**: `#1 GET /users`, `#2 POST /orders`, `#3 DELETE /carts/{id}` …
  - _position_: "Which call was #3?" (L1–3)
  - _successor_: "Which call came right after POST /orders?" (L3–6) — memoria asociativa
  - _order_: reconstruir la secuencia completa con la respuesta `ordering` (L5–10)
- **Unicidad**: todas las llamadas de una secuencia son distintas; la respuesta se deduce
  directamente de la posición. En _successor_ la llamada dada nunca aparece como opción. En
  _order_ la solución es la única permutación correcta y los items se muestran en un orden distinto
  del original.
- **Distractores**: primero los vecinos de la respuesta (el error off-by-one), luego el resto de la
  secuencia, y por último llamadas no ejecutadas sobre los mismos recursos. Con `similarCalls` (L6+)
  las llamadas usan solo dos recursos y difieren en método o profundidad de ruta
  (`GET /users/{id}` vs `DELETE /users/{id}` vs `GET /users/{id}/roles`).

### `variable-state` — Variable state (L2–10)

- **Objetivo**: calcular y **mantener actualizado** el estado de varias variables.
- **Ejemplo**: `1 x = 3`, `2 y = x + 2`, `3 x = y * 2` → _"What was the final value of x?"_ → `10`.
  Desde L7 también _"What was the value of x right after line 4?"_ (memoria contextual: cuándo).
- **Unicidad / calidad** (la generación reintenta hasta cumplirlas): la variable preguntada se
  asignó al menos dos veces hasta el punto preguntado; su última asignación lee una variable; su
  valor difiere del inicial; desde 5 líneas, leer valores viejos ("stale") da otro resultado; si se
  pregunta una línea intermedia, el valor cambia después; todos los valores están en ±99. La
  respuesta la comprueba un intérprete independiente escrito en el test.
- **Distractores** (L2–3, choice): resultados de errores reales de traza — olvidar un update, leer
  el primer valor en lugar del actual, dar el valor de otra variable o un valor anterior — y luego
  ±1/±2/±10. Desde L4 la respuesta es **numérica exacta** (no hay opciones en las que apoyarse).

### `position-recall` — Grid positions (L1–10)

- **Objetivo**: memoria visoespacial de keywords en una cuadrícula.
- **Ejemplo**: cuadrícula 4×4 con `map`, `push`, `null`… → _"Where was the keyword “map”?"_ → el
  jugador pulsa la celda (respuesta `locate`, índice fila-major, `itemCount = filas × columnas`).
- **Unicidad**: cada keyword aparece como máximo una vez; la solución es el índice de la única
  celda que la contiene.
- **Distractores**: al ser `locate`, el distractor es la propia cuadrícula: con `similarKeywords`
  (L5+) las palabras salen de pocas familias de parecidas (`map/max/min/mod`, `get/set/put/let`) y la
  keyword preguntada **siempre** tiene una gemela visible; la explicación indica dónde estaba.
- **UI**: en respuesta, todas las celdas son botones con `aria-label` "Row r, column c" (accesible con
  teclado); en revisión, "✓ answer" y "✗ your pick" en texto además del color.

### `cross-reference` — Cross-reference lookup (L7–10)

- **Objetivo**: localizar un registro por un campo y recordar **otro** campo del mismo registro.
- **Ejemplo**: tabla de `User` → _"The User whose role was AUDITOR — what was its id?"_.
- **Unicidad**: todas las columnas no booleanas tienen valores distintos entre registros, así que la
  clave identifica un único registro y cada valor objetivo pertenece a uno solo.
- **Distractores**: los valores objetivo de los **otros** registros (el error de fila equivocada) y
  valores cercanos (ids permutados, enteros a pocos pasos).

### `foreign-key-join` — Foreign-key joins (L9–10)

- **Objetivo** (razonamiento nuevo en expert): seguir una relación entre dos tablas que ya no se
  ven. Dos búsquedas encadenadas: clave → id del padre → hijo con esa foreign key → campo.
- **Ejemplo**: `User` (id, name, role) y `Order` (id, userId, status, items) → _"The User whose role
  was VIEWER has one Order (linked by userId). What was that Order's status?"_
- **Unicidad**: la clave es única entre padres; cada hijo apunta a un padre distinto; ids de padres
  e hijos son disjuntos. Además **ningún hijo está en la misma fila que su padre** (desarreglo), así
  que no hay atajo posicional.
- **Distractores**: el campo objetivo de los otros hijos; si se pregunta el `id` del hijo, también el
  id del padre (confundir PK con FK es el error clásico).

## Tiempo de estudio

`studyMs = clamp(unidades × peso × perItemMs, minMs, timing.studyMs)`, redondeado a 0,5 s.
Unidades = campos mostrados, llamadas, líneas o celdas ocupadas; peso por tipo: campo/celda 1,
llamada 1,5, asignación 3 (hay que calcularla además de recordarla). `timing.studyMs` del nivel es el
**máximo**; cada challenge recibe menos si muestra menos. El jugador puede terminar antes con
"I'm ready". `perItemMs` baja de 1500 ms (L1) a 850 ms (L10).

## Niveles

| Nivel | Tier         | Objetivo                                                                     | Carga de memoria (records · llamadas · líneas/vars · grid) | Estudio (máx · por ítem) | Límite · objetivo | Complejidad / interferencia                             | Novedad                                                                                   |
| ----- | ------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------ | ----------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1     | fundamentals | Hold a few fields, calls and positions in mind for a few seconds.            | 1×3 · 4 · — · 3×3 (5)                                      | 15 s · 1,5 s             | 60 s · 10 s       | Baja; 3 distractores                                    | Records, llamadas por posición, cuadrícula                                                |
| 2     | fundamentals | Keep two records apart and track a variable through an update.               | 2×3 · 5 · 3/2 · 3×3 (6)                                    | 15 s · 1,4 s             | 60 s · 10 s       | Baja; operaciones `+ -`                                 | `variable-state` (choice)                                                                 |
| 3     | fundamentals | Remember what followed what, and positions on a larger grid.                 | 2×4 · 5 · 4/2 · 4×4 (7)                                    | 16 s · 1,3 s             | 60 s · 12 s       | Baja                                                    | Pregunta _successor_; grid 4×4                                                            |
| 4     | intermediate | Exact answers: compute and hold three variables with no options to lean on.  | 3×4 · 6 · 5/3 · 4×4 (8)                                    | 18 s · 1,2 s             | 75 s · 14 s       | Media; 4 distractores                                   | Respuesta **numérica** en variables                                                       |
| 5     | intermediate | Interference: look-alike ids and keywords, and rebuilding a full call order. | 3×4 · 6 · 5/3 · 4×4 (9)                                    | 18 s · 1,1 s             | 75 s · 15 s       | Alta: ids permutados, nombres y keywords parecidos; `*` | Similitud alta; reconstrucción de orden (`ordering`)                                      |
| 6     | intermediate | Similar calls on the same resources: encode the exact order, not the gist.   | 3×5 · 7 · 6/3 · 4×4 (10)                                   | 20 s · 1,05 s            | 90 s · 18 s       | Alta; llamadas similares                                | `similarCalls`                                                                            |
| 7     | advanced     | Look records up by another field and recall state at a given line.           | 4×5 · 7 · 6/3 · 5×5 (11)                                   | 20 s · 1,0 s             | 90 s · 20 s       | Alta; 5 distractores                                    | `cross-reference`; valor tras una línea concreta; grid 5×5; solo `ordering` en secuencias |
| 8     | advanced     | Four records, four variables and eight similar calls held at once.           | 4×5 · 8 · 7/4 · 5×5 (13)                                   | 22 s · 0,95 s            | 90 s · 22 s       | Alta                                                    | 4 variables                                                                               |
| 9     | expert       | Joins: follow a foreign key between two tables you can no longer see.        | 5×5 · 9 · 8/4 · 5×5 (15) · join 3+3                        | 22 s · 0,9 s             | 120 s · 24 s      | Muy alta; sin `record-recall` simple                    | `foreign-key-join` (dos búsquedas encadenadas, sin atajo posicional)                      |
| 10    | expert       | Maximum load and interference with the shortest study time per item.         | 5×6 · 10 · 9/4 · 5×5 (18) · join 4+4                       | 24 s · 0,85 s            | 120 s · 25 s      | Máxima                                                  | Máxima carga con el menor tiempo por ítem                                                 |

Notación de carga: `records×campos` · longitud de la secuencia · `líneas/variables` · `grid (celdas
ocupadas)`. Los distractores pasan de 3 (L1–3) a 4 (L4–6) y 5 (L7–10). Todos los ejes de carga son
no decrecientes y `perItemMs`/`minMs` no crecientes (lo verifican los tests).

### Por qué L9–10 son realmente difíciles

- Un `foreign-key-join` de L10 muestra 28 valores (4 padres × 3 campos + 4 hijos × 4 campos), con
  ids de padres e hijos formados por los mismos dígitos, en ≤ 24 s, y exige encadenar dos búsquedas.
- Las secuencias son de 9–10 llamadas sobre solo dos recursos, a reconstruir completas.
- Las trazas tienen 8–9 líneas con 4 variables, multiplicaciones y preguntas sobre una línea
  intermedia cuyo valor cambia después.
- La cuadrícula 5×5 tiene 15–18 keywords de 5–6 familias de parecidas.

## Decisiones

- **Tipos añadidos**: `foreign-key-join` separa del `cross-reference` el razonamiento de dos saltos
  para introducirlo solo en expert.
- **Booleanos solo como carga**: se muestran pero nunca se preguntan (2 opciones = 50 % de acierto
  por azar).
- **Tiempo de estudio por challenge** en lugar de fijo por nivel: una cuadrícula de 5 palabras no
  necesita el mismo tiempo que 8 asignaciones.
