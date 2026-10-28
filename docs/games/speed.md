# Categoría Speed (Velocidad mental)

Diez juegos de velocidad, registrados en `src/games/speed/index.ts` en este orden. Todos son
**con límite de tiempo** (`timed(targetMs, limitMs)`), feedback `brief` y miden
`accuracy` + `response-time` (Reaction Test mide `reaction-time`, el único formato `tap`). Contenido
puro en `content/`, vista en `ui/`, tests en `<slug>.test.tsx` (contrato + oráculo independiente +
progresión + vista/interacción + presupuesto de generación < 5 ms).

Ayudantes compartidos en `src/games/speed/shared/`:

- `content/scoring.ts`: `SPEED_SCORING = { maxSpeedBonus: 1, accuracyWeight: 0.6 }`. Un acierto
  rápido puede valer hasta el doble que uno lento, pero un error resta puntos (−25) y la rapidez
  solo cuenta en aciertos, así que la precisión domina siempre el índice.
- `content/choice.ts`: `fixedChoice(labels, correctIndex)`: opciones en orden **fijo** (cada tecla
  significa lo mismo toda la sesión, como en una tarea de tiempo de elección); el generador elige
  `correctIndex` de forma uniforme.
- `testing.ts` (solo tests): `sweep` (todos los niveles × semillas) y `meanGenerationMs`.

| id                          | Nombre                            | Mecánica                                                                     | Formato                                                     | Qué varían los 10 niveles                                                                                                                                                                                              | Puntuación / medidas                                                   | Estado                |
| --------------------------- | --------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------- |
| `reaction-test`             | Reaction Test                     | Esperar una señal y tocar; luego go/no-go y go con pista                     | `tap`                                                       | simple → go/no-go → go cambiante con pista; ventana más corta; formas parecidas                                                                                                                                        | accuracy, reaction-time; scoring propio `{0.25, 0.85}`                 | implementado (previo) |
| `rapid-symbol-matching`     | Rapid Symbol Matching             | ¿Iguales o distintas? / ¿qué candidata es copia exacta?                      | `single-choice` (Same/Different fijo; candidatas barajadas) | longitud 3→7; 2 cambios → 1; letras → símbolos → grupos confundibles (b d p q, O Q C G…); intercambio de vecinas desde nivel 7; 3→4 candidatas                                                                         | accuracy, response-time                                                | implementado          |
| `number-comparison`         | Number Comparison                 | Elegir el mayor (o el menor)                                                 | `single-choice` (los números son las opciones)              | 2→4 valores; 1→4 dígitos cada vez más próximos (mismas cifras iniciales); "smallest" desde nivel 4; decimales de distinta longitud (0.5 vs 0.45), fracciones con distinto denominador, expresiones; mezcla en nivel 10 | accuracy, response-time; comparación exacta por multiplicación cruzada | implementado          |
| `visual-search-sprint`      | Visual Search Sprint              | Encontrar el único objetivo en una cuadrícula                                | `locate` (celdas de `CellGrid`)                             | 9→36 celdas (≤ 6 columnas); búsqueda por rasgo (forma) → formas parecidas → conjunción color × forma → conjunción con formas parecidas                                                                                 | accuracy, response-time                                                | implementado          |
| `rapid-classification`      | Rapid Classification              | Clasificar un objeto cotidiano en su grupo                                   | `single-choice` (grupos fijos por nivel)                    | 2→4 grupos; imagen → solo palabra; desde nivel 7 regla con pista CATEGORY / FIRST LETTER (A–M / N–Z), proporción de la segunda regla 0.25→0.5                                                                          | accuracy, response-time                                                | implementado          |
| `color-and-shape-decisions` | Color and Shape Decisions         | Cambio de tarea: una pista COLOUR / SHAPE indica qué rasgo responder         | `single-choice` (teclas fijas)                              | una regla → dos reglas con teclas separadas → teclas compartidas ("red / circle") donde los estímulos incongruentes necesitan la pista; mezcla de reglas → 50 %; incongruencia 0.3→0.8; 2→3 valores por rasgo          | accuracy, response-time                                                | implementado          |
| `fast-sequence-recognition` | Fast Sequence Recognition         | Vistazo breve a una secuencia (fase de estudio), reconocerla entre parecidas | `single-choice`                                             | longitud 3→7; vistazo 2,5 s → 1 s; 2→4 candidatas; dígitos / letras / formas; desde nivel 8 solo cambia el orden                                                                                                       | accuracy, response-time (desde que se oculta)                          | implementado          |
| `mental-arithmetic-sprint`  | Mental Arithmetic Sprint          | Cálculos rápidos: verdadero/falso o escribir el resultado                    | `single-choice` (True/False fijo) y `numeric`               | sumas de una cifra → ±20 → tablas y división → dos cifras → dos cifras × una → tres operandos con precedencia y paréntesis; verificar → escribir                                                                       | accuracy, response-time                                                | implementado          |
| `code-scan-sprint`          | Code Scan                         | Pseudocódigo corto + pregunta; señalar la línea                              | `locate` (cada línea es un botón)                           | 4→12 líneas; "calls print" / "uses the number 7" → primera/última asignación (con asignaciones señuelo) → condición que menciona una variable usada en otras líneas; bloques anidados (profundidad 0→2); 2→4 variables | accuracy, response-time                                                | implementado          |
| `multi-choice-processing`   | Multi-Choice Processing Challenge | Flanker: dirección de la flecha central                                      | `single-choice` (direcciones fijas)                         | flecha sola → flancos congruentes/neutros → incongruencia 0.3→0.8; 2 → 4 direcciones; fila 5→7; desde nivel 7 regla con pista CENTRE / OUTER                                                                           | accuracy, response-time                                                | implementado          |

## Garantías comunes

- **Respuesta calculada por código** y verificada con un oráculo independiente en todos los
  niveles y muchas semillas: evaluador de expresiones propio (aritmética), comparación de valores a
  partir de la etiqueta (Number Comparison), lectura del texto de las líneas (Code Scan), igualdad de
  cadenas (Symbol Matching), recálculo de la flecha respondida (flanker), etc.
- **Inequívoca**: `retryGeneration` descarta empates, etiquetas duplicadas, fracciones de igual
  denominador o listados de código con más de una línea que responda a la pregunta.
- **No adivinable**: la respuesta se elige de forma uniforme (tecla fija) o se baraja
  (`singleChoice`); en Fast Sequence Recognition las candidatas se construyen alrededor de un centro
  oculto que es el objetivo con probabilidad 1/n, de modo que ni "la más típica" ni "la rara" ganan
  al azar (hay un test que lo comprueba). En Code Scan la línea respuesta se elige uniforme entre las
  líneas posibles.
- **Color nunca es la única pista**, salvo donde la tarea trata de color (ver limitaciones): las
  flechas se distinguen por forma, los glifos de las secuencias tienen todas las formas distintas, la
  búsqueda por rasgo usa solo forma y las pistas de regla se escriben con palabra + icono.
- **Sin parpadeo**: cada estímulo aparece una vez y queda quieto; nada cambia más de 3 veces/s.
- **Velocidad nunca es el único indicador**: accuracy siempre se informa; la rapidez solo suma en
  aciertos. Todos los juegos nuevos son `relaxedFriendly: true` (el modo relajado quita el límite y,
  donde hay fase de estudio, duplica el vistazo): la tarea sigue teniendo sentido, pero el resultado
  ya no refleja rapidez.
- **Teclado completo**: opciones con teclas 1–n; en `locate` las celdas/líneas son botones que se
  recorren con Tab y flechas. Todo cabe en 360 px (filas de ≤ 7 flechas, ≤ 6 columnas, líneas de
  código ≤ 28 caracteres con `overflow-x-auto` de seguridad).

## Limitaciones conocidas

- **Tiempo de decisión, no de reacción**: los juegos nuevos miden `response-time` (desde que aparece
  la pregunta hasta responder), que incluye leer, decidir y mover el dedo. Solo Reaction Test (`tap`)
  mide tiempo de reacción puro.
- **Color and Shape Decisions** exige visión del color en las pruebas COLOUR (la tarea es el color).
  La paleta evita rojo/verde (rojo, azul, amarillo) y la etiqueta accesible nombra color y forma.
- **Visual Search Sprint**: en los niveles de conjunción (5–10) la mitad de los distractores tiene la
  forma del objetivo en otro color, así que hace falta distinguir colores. Los niveles 1–4 se
  resuelven solo por forma.
- **"Frecuencia de cambio"**: el generador no ve la prueba anterior (cada challenge es
  independiente), así que el cambio de regla se controla con la proporción de mezcla (tasa de cambio
  esperada 2·p·(1−p), máxima en p = 0,5), no con una secuencia exacta de cambios.
- **Lectores de pantalla**: las tareas son visuales. Las cadenas se leen símbolo a símbolo ("small b,
  capital Q"), las filas de flechas como lista de direcciones y las celdas con fila, columna, color y
  forma; es jugable, pero el conflicto visual que da dificultad (flanker, búsqueda) se pierde en gran
  parte. En Fast Sequence Recognition un vistazo corto puede acabar antes de que se lea entero (se
  recomienda el modo relajado).
- **Rapid Classification** excluye objetos ambiguos del kit (mushroom, fish, honey, glasses, egg,
  milk). La regla de primera letra depende del nombre inglés.
- **Number Comparison** usa la notación con punto decimal (0.45) y fracciones "3/4"; los lectores de
  pantalla reciben "3 over 4".
- Los tests de páginas (`src/features/*`) tenían 7 fallos durante este trabajo, idénticos con y sin
  los nuevos juegos registrados (no dependen de esta categoría).
