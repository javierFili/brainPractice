# Pattern Architect — diseño del juego

**Área:** Patterns · **Id:** `pattern-architect` · **Código:** `src/games/pattern-architect/`

Encuentra la regla que hay detrás de lo que ves y aplícala a un caso nuevo. El juego entrena el paso
que todo programador da antes de escribir código: mirar ejemplos, separar lo que varía de lo que
permanece fijo y nombrar la transformación que conecta entradas con salidas.

Los números se mantienen pequeños (términos de secuencia ≤ 250, los elementos de las listas son
dígitos 0–9, las cuadrículas tienen como máximo seis símbolos por celda). La dificultad proviene de la
**composición** (de una regla a tres operaciones encadenadas), la **abstracción** (de regularidades
visibles a programas ocultos y estructura sin nombres) y la **menor evidencia** (el mínimo de ejemplos
que aún fuerza la respuesta).

## Habilidades de pensamiento de programación entrenadas

Habilidades principales declaradas en la definición del juego (las que muestra el catálogo): `pattern-recognition`, `abstraction`, `algorithmic-thinking` y `decomposition`. La tabla detalla también habilidades secundarias que se ejercitan en tipos concretos.

| Habilidad                                | Dónde aparece                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Reconocimiento de patrones               | Todos los tipos: encontrar una regularidad que explique _toda_ la evidencia, no solo el último elemento.             |
| Abstracción                              | Programas ocultos, analogías de árboles y emparejamiento de grafos: razonar sobre una transformación o una forma.    |
| Descomposición                           | Cuadrículas (formas y cantidades siguen reglas separadas), programas de varios pasos (¿qué hizo cada paso?).         |
| Pensamiento algorítmico                  | Los programas ocultos son pipelines de operaciones sobre listas: el mismo razonamiento que encadenar `map`/`filter`. |
| Generalización / depuración de hipótesis | Distractores near-miss: hay que descartar una regla que encaja con todos los ejemplos menos uno.                     |

No se presupone ningún lenguaje ni algoritmo con nombre. Las operaciones se describen con palabras
("move the first item to the end"), los árboles se escriben `a(b, c)` = "a contiene b y c, en ese
orden" y los grafos como "a → b, c" = "a apunta a b y a c".

## Tipos de challenge

Todos los tipos se responden con **single choice** (1 opción correcta + 3 distractores). Cada
generador tiene un control de calidad con `retryGeneration`: un candidato ambiguo, trivial o ilegible
se rechaza y se regenera desde el mismo flujo con seed.

### `number-sequence` — niveles 1–6

- **Objetivo:** dar el siguiente término. Ejemplo: `4, 8, 14, 22, 32, 44, 58, ?` → **74** (el paso
  crece de 2 en 2: +4, +6, +8, …).
- **Catálogo de reglas** (`SequenceRule`): paso constante, pasos alternos, paso creciente (segunda
  diferencia constante), multiplicación, dos secuencias intercaladas, un ciclo de tres pasos,
  multiplicar y luego sumar, suma de los dos anteriores, multiplicación/suma alternas.
- **Unicidad:** los parámetros de cada familia quedan fijados por los primeros términos, así que el
  solver ajusta todas las familias (con _cualquier_ parámetro entero, mucho más allá de lo que usa el
  generador), se queda con las que reproducen todos los términos mostrados y exige que todas predigan
  el mismo siguiente término. Los tests lo vuelven a comprobar con una fuerza bruta independiente sobre
  ~18 000 combinaciones acotadas de parámetros. Se rechazan las secuencias en las que un término repite
  el anterior (un "estancamiento").
- **Distractores:** continuaciones producidas por malas lecturas plausibles: repetir solo el último
  paso (la trampa clásica de la primera diferencia), extrapolar el cambio del paso, suponer pasos
  alternos o en ciclo de tres, continuar la secuencia equivocada de dos intercaladas, sumar los dos
  últimos, una razón constante y un término de más.

### `symbol-grid` — niveles 1–6

- **Objetivo:** completar la celda que falta en una cuadrícula de 3×3 (4×4 desde el nivel 4). Una
  celda es una forma repetida _count_ veces, p. ej. `▲▲▲` (3 triángulos). Formas y cantidades siguen
  reglas **independientes**.
- **Reglas** (`GridRule`): constante, por fila, por columna, cada fila = la fila de arriba desplazada
  a la izquierda/derecha (un cuadrado latino), cantidades que avanzan ±1 a lo largo de filas/columnas,
  la última cantidad de una fila/columna = suma de las demás.
- **Unicidad:** para cada atributo, el solver prueba un conjunto de hipótesis más amplio que el que usa
  el generador (añade "todas las filas contienen el mismo conjunto de valores" y progresiones por fila)
  y exige que todas las hipótesis que encajan con las ocho/quince celdas visibles coincidan. Los tests lo
  comprueban de forma independiente probando _todos_ los valores posibles para el hueco (5 formas ×
  cantidades 1–9) contra reglas de cuadrícula completa y verificando que sobrevive exactamente una
  compleción, y que exactamente una opción es esa compleción.
- **Distractores:** predicciones de hipótesis que **no** encajan (copiar la columna en lugar de la
  fila, desplazar en sentido contrario, leer una suma como una progresión), una cantidad desviada en
  uno y después otros valores visibles: primero cambiando un atributo (sutil) y luego ambos.

### `transform-inference` — niveles 4–10

- **Objetivo:** un programa oculto de 1–3 pasos convierte cada lista de entrada en su salida; dar la
  salida para una entrada nueva. Ejemplo (profundidad 2): `[9, 2, 6, 7, 4] → [5, 8, 7, 3, 10]`,
  `[4, 1, 4, 2] → [3, 5, 2, 5]`; nueva entrada `[7, 1, 7, 4]` → **`[5, 8, 2, 8]`** (invertir y luego
  sumar 1).
- **Unicidad:** el generador busca en **todo el catálogo** (19 operaciones, no solo el subconjunto del
  nivel) hasta la profundidad del nivel. Los programas se agrupan por su comportamiento sobre todas las
  entradas (poda exacta: un comportamiento idéntico sigue siéndolo tras cualquier paso adicional). Los
  ejemplos se añaden de uno en uno (mínimo 2, máximo por nivel) hasta que todos los programas
  consistentes predicen la misma salida; si se alcanza antes el tope, el candidato se rechaza. Los
  ejemplos además deben **necesitar** la profundidad completa: si un programa más corto los explica, se
  añaden más ejemplos o se rechaza el candidato. Cada paso debe cambiar visiblemente la nueva entrada, y
  los programas no pueden repetir un paso dos veces seguidas ni usar un único tipo de cambio (orden /
  valores / selección). Los tests lo vuelven a comprobar con una enumeración ingenua de los 7 240
  programas de ≤ 3 pasos, sin poda.
- **Distractores:** los pasos correctos en el orden equivocado, el programa con un paso olvidado,
  programas que encajan con todos los ejemplos **menos uno** (near misses), un paso parecido
  intercambiado (rotate left ↔ right, keep even ↔ odd, add 1 ↔ add 2 …) y, como último recurso, un
  único paso plausible.
- La UI muestra el vocabulario completo de pasos ("Possible steps"), de modo que el espacio de reglas
  es explícito.

### `structure-match` — niveles 7–10

- **Objetivo:** ¿cuál de los cuatro grafos tiene la misma estructura de conexiones que el de
  referencia? Solo cambian los nombres (nodos de referencia `a–g`, candidatos `1–7`). Los grafos son
  pequeños (5–7 nodos), acíclicos y conexos, como dependencias entre módulos o llamadas entre
  servicios.
- **Unicidad:** los señuelos son mutaciones de la referencia de las que se verifica que **no** son
  isomorfas a ella ni entre sí (isomorfismo por backtracking restringido a nodos con el mismo número de
  flechas). Los tests lo vuelven a comprobar con una forma canónica por fuerza bruta sobre todas las
  permutaciones de nodos.
- **Distractores:** en los niveles 7–8 se mueve un extremo de una flecha (`rewire`), así que cambia el
  número de flechas de algún nodo: un recuento cuidadoso lo delata. En los niveles 9–10 se
  intercambian los destinos de dos flechas (`degree-preserving`): cada nodo conserva sus flechas de
  entrada y salida y solo difiere el cableado, así que el jugador debe seguir las conexiones, no
  contarlas.
- **Explicación:** da el renombrado que lleva la referencia a la respuesta y, para cada señuelo, un
  motivo comprobable (un nodo con un perfil de flechas que la referencia no tiene, o un nodo cuyos
  destinos difieren).

### `tree-analogy` — niveles 7–10

- **Objetivo:** `A → A′` (y a veces `B → B′`) como `C → ?`. Los árboles son ordenados, con ≤ 7
  elementos, como un listado de carpetas o un árbol de componentes. Ejemplo:
  `h(i, e(r(j))) → h(j, r, e, i)`; nuevo árbol `z(y, q(s), b)` → **`z(b, s, q, y)`** (aplanar y luego
  reflejar).
- **Operaciones** (`TreeOp`): reflejar todo el árbol, invertir solo el nivel superior, mover el primer
  elemento del nivel superior al final, eliminar todas las hojas, aplanar en la raíz (en orden de
  lectura), ordenar los hijos alfabéticamente. Los niveles 9–10 componen dos de ellas.
- **Unicidad / distractores:** la misma maquinaria que los programas ocultos (`programSpace.ts`):
  todas las reestructuraciones hasta la profundidad dada que encajan con los pares de ejemplo deben
  coincidir; los distractores son órdenes equivocados, un paso omitido, operaciones parecidas, near
  misses y operaciones sueltas. Cada ejemplo usa letras distintas, de modo que solo se transfiere la
  estructura.

## Catálogo de operaciones (programas ocultos)

| Operación         | Descripción                                             | Tipo      |
| ----------------- | ------------------------------------------------------- | --------- |
| `reverse`         | invertir la lista                                       | order     |
| `sort-ascending`  | ordenar de menor a mayor                                | order     |
| `sort-descending` | ordenar de mayor a menor                                | order     |
| `rotate-left`     | mover el primer elemento al final                       | order     |
| `rotate-right`    | mover el último elemento al principio                   | order     |
| `swap-pairs`      | intercambiar cada par de vecinos (1.º↔2.º, 3.º↔4.º, …)  | order     |
| `add` 1/2/3       | sumar k a cada elemento                                 | values    |
| `double`          | duplicar el valor de cada elemento                      | values    |
| `running-total`   | sustituir cada elemento por la suma acumulada hasta él  | values    |
| `drop-first`      | eliminar el primer elemento                             | selection |
| `drop-last`       | eliminar el último elemento                             | selection |
| `take-first` 2/3  | quedarse solo con los n primeros elementos              | selection |
| `keep-even`       | quedarse solo con los números pares                     | selection |
| `keep-odd`        | quedarse solo con los números impares                   | selection |
| `remove-repeats`  | eliminar los valores repetidos (se conserva el primero) | selection |
| `duplicate-each`  | escribir cada elemento dos veces                        | selection |

Los niveles 4–5 y 8 generan a partir de un conjunto básico cuyo efecto es visible en un único ejemplo
(reverse, sort ascending, ambas rotaciones, drop first/last, add, double, keep even/odd); los niveles
6–7 y 9–10 añaden los que dependen de los datos (`sort-descending`, `duplicate-each`, `take-first`,
`swap-pairs`, `remove-repeats`, `running-total`). La unicidad se comprueba siempre contra todos ellos.

## Niveles

Campos del perfil (`PatternProfile`): `abstractionLevel` (1–5), `complexity` (máximo de reglas
compuestas en un challenge), `distractors` (3 en todos los niveles) y parámetros por tipo
(`sequenceLength`, tamaño de la cuadrícula, `depth`/`elementCount`/`maxExamples` del programa,
`elementCount`/`arrowCount` del grafo, `depth` del árbol).

| Nivel | Tier         | Objetivo                                                                | Límite de tiempo / objetivo | Abstracción | Profundidad de composición          | Complejidad (contenido)                                                                              | Novedad en este nivel                                                  |
| ----- | ------------ | ----------------------------------------------------------------------- | --------------------------- | ----------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1     | Fundamentals | Detectar una regularidad: un paso constante o un atributo que cambia    | 60 s / 20 s                 | 1           | 1 regla                             | 5 términos (pasos constantes / alternos); cuadrícula 3×3, varía un atributo                          | Secuencias, cuadrículas                                                |
| 2     | Fundamentals | Pasos que cambian; dos atributos con reglas separadas                   | 75 s / 25 s                 | 1           | 2 reglas (cuadrícula)               | 5 términos (+ paso creciente, multiplicación); las formas pueden desplazarse como un cuadrado latino | Segundas diferencias, cuadrículas de dos atributos                     |
| 3     | Fundamentals | Secuencias intercaladas; cantidades aritméticas                         | 90 s / 30 s                 | 2           | 2 reglas                            | 6 términos (+ intercaladas); las cantidades avanzan ±1 o suman a lo largo de una fila/columna        | Dos secuencias a la vez, sumas/progresiones dentro de la cuadrícula    |
| 4     | Intermediate | Inferir un programa oculto de un paso a partir de ejemplos              | 90 s / 35 s                 | 2           | 1 paso (programas), 2 (cuadrículas) | 7 términos (+ ciclos de pasos, multiplicar-sumar); cuadrículas 4×4; listas de ~4, ≤ 3 ejemplos       | `transform-inference`, cuadrículas 4×4                                 |
| 5     | Intermediate | Dos pasos encadenados: separar lo que aporta cada uno                   | 120 s / 45 s                | 3           | 2 pasos                             | 7 términos (+ suma de los dos anteriores, ×/+ alternos); ≤ 4 ejemplos                                | Composición; el orden de los pasos importa                             |
| 6     | Intermediate | Pasos que dependen de los datos, con menos ejemplos                     | 120 s / 50 s                | 3           | 2 pasos                             | Listas de ~5, vocabulario completo, ≤ 3 ejemplos; cuadrículas solo con cantidades aritméticas        | Repetidos, pares, sumas acumuladas                                     |
| 7     | Advanced     | Estructura sobre contenido: emparejar grafos, reestructurar árboles     | 150 s / 60 s                | 4           | 2 pasos / 1 operación de árbol      | Grafos de 5 nodos / 5 flechas (señuelos `rewire`); árboles ≤ 6 elementos, ≤ 2 ejemplos               | `structure-match`, `tree-analogy`; se retiran secuencias y cuadrículas |
| 8     | Advanced     | Programas de tres pasos, grafos mayores, reglas de árbol con un ejemplo | 180 s / 75 s                | 4           | 3 pasos / 1 operación de árbol      | Vocabulario básico, ≤ 4 ejemplos; grafos 6 / 7; árboles ≤ 7 elementos, 1 ejemplo                     | Pipelines de tres pasos                                                |
| 9     | Expert       | Grafos parecidos; reglas de árbol de dos pasos                          | 210 s / 90 s                | 5           | 3 pasos / 2 operaciones de árbol    | Vocabulario completo, ≤ 4 ejemplos; grafos 6 / 7 con señuelos `degree-preserving`                    | Señuelos con idéntico número de flechas; reglas de árbol compuestas    |
| 10    | Expert       | Evidencia mínima en todo                                                | 240 s / 100 s               | 5           | 3 pasos / 2 operaciones de árbol    | Vocabulario completo, ≤ 3 ejemplos; grafos 7 / 9 `degree-preserving`; árboles de 7 elementos         | Las pistas mínimas, las estructuras más grandes                        |

Invariantes comprobados por los tests (`content/__tests__/`):

- `validateLevelTable` no da errores; la abstracción, la complejidad, la profundidad de programas y
  árboles, el tamaño de los grafos y los tiempos nunca decrecen; profundidad del programa ≤
  `complexity`; cada tipo aparece solo en sus niveles; señuelos `degree-preserving` solo en 9–10.
- Sobre 30 seeds × 10 niveles: determinismo por seed; `evaluateAnswer` acepta la solución; las opciones
  son distintas y su número es `distractors + 1`; la explicación contiene la respuesta; la respuesta
  queda determinada de forma única por un solver **independiente** para cada tipo (secuencias por
  fuerza bruta, todas las compleciones de la cuadrícula, enumeración de programas sin poda, formas
  canónicas por permutación), y los ejemplos de los programas ocultos necesitan la profundidad completa
  declarada.
- La generación tarda de media muy por debajo de 20 ms por challenge en el nivel 10 (≈ 4 ms medidos).
