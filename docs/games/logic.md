# Categoría Logic

Diez juegos de razonamiento, registrados en `src/games/logic/index.ts` en este orden. Ninguno
contiene código ni sintaxis de programación: están pensados para gente que nunca ha programado.
Todos son **sin límite de tiempo** (`limitMs: null`, `targetMs` solo orienta la dificultad
adaptativa), con `feedback: 'explain'` (explicación generada a partir del solver), 3–6 desafíos por
sesión, `category: 'logic'` y `area: 'logic'`.

Estructura habitual: contenido puro en `content/` (tipos, niveles, solver, `definition.ts`), vista
en `ui/`, tests en `<slug>.test.tsx` (contrato + oráculo independiente en todos los niveles y
muchas semillas + progresión + interacción cuando la vista responde). Ayudantes compartidos en
`src/games/logic/shared/`: `content/` (`permutations`, `indexPermutations`, `booleanAssignments`,
`PEOPLE`, `listJoin`, `ordinal`, `capitalize`, `fixedChoice`, `orderingResponse`, `Draft`) y `ui/`
(`Panel`, `ClueList`, `Chips`). `src/games/logic/logic.test.ts` comprueba la categoría entera
(registro, sin tiempo, 3–8 desafíos, instrucciones de 3–5 líneas, sin sintaxis de código, y
generación < 5 ms de media por desafío).

| id                      | Nombre                     | Mecánica                                                                                                                                                                                 | Formato de respuesta                                                                                                                      | Qué varían los 10 niveles                                                                                                                                                                                                                  | Puntuación / medidas                                                                                           | Estado       |
| ----------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------ |
| `logical-deduction`     | Logical Deduction          | Quién tiene qué: personas × listas (mascotas, colores, bebidas, aficiones), cada valor una sola vez. Se añaden pistas verdaderas hasta que queda una tabla y se quitan las redundantes   | `single-choice` (todas las personas o todos los valores de la lista; posición barajada)                                                   | 3 personas × 1 lista → 4×1 → 3×2 → 3×3 → 4×2 → 4×3 → 5×2 (espacio de búsqueda no decreciente); de pistas “tiene / no tiene” a “o … o”, pistas cruzadas entre listas y negativas cruzadas; sin pistas directas en los niveles 7 y 10        | accuracy; pregunta sobre un hecho que ninguna pista dice directamente                                          | implementado |
| `number-sequences`      | Number Sequences           | Serie de 7 términos con una regla; escribir el siguiente o el que falta                                                                                                                  | `numeric`                                                                                                                                 | sumar constante → con pasos negativos → multiplicar → hueco en medio → pasos alternos → diferencias crecientes → dos series intercaladas → reglas de dos pasos (×r, +b) → suma de los dos anteriores → mezcla con huecos frecuentes        | accuracy; valor exacto                                                                                         | implementado |
| `rule-discovery`        | Rule Discovery             | Ejemplos “encaja ✓” / “no encaja ✗” (glifos forma+color, o números 1–99); elegir el nuevo elemento que encaja                                                                            | `single-choice` (3→5 opciones; `renderOption` dibuja el glifo con su nombre)                                                              | color → color o forma → números (par, mayor/menor) → negaciones → tablas y rangos → reglas “o” → mezcla → reglas “y” → menos ejemplos y más opciones                                                                                       | accuracy; toda regla considerada que respeta los ejemplos elige la misma única opción                          | implementado |
| `conditional-reasoning` | Conditional Reasoning      | Enunciados “si … entonces”, hechos, cadenas, “unless”, “only if”, “either … or”; decidir si una frase debe ser verdadera, falsa o no se sabe                                             | `single-choice` con orden fijo “Must be true / Must be false / Can't tell”; el veredicto correcto se elige uniformemente antes de generar | modus ponens → + modus tollens → + falacias (afirmar el consecuente, negar el antecedente) → “not” dentro de las reglas → cadenas de 2 y 3 → “unless” → “only if” → conjuntos mixtos de 3 y 4 frases                                       | accuracy; veredicto por tabla de verdad                                                                        | implementado |
| `constraint-solver`     | Constraint Solver          | Cuadrado latino / mini-sudoku / con pistas “A1 < B1”; decir el número de la celda resaltada                                                                                              | `numeric`                                                                                                                                 | 3×3 con muchas pistas → 3×3 con pocas → 4×4 → 4×4 con cajas → 4×4 con desigualdades → 5×5 → 5×5 con desigualdades → 6×6 con cajas 2×3 → menos pistas → cajas + desigualdades                                                               | accuracy; la cuadrícula tiene exactamente una solución (backtracking)                                          | implementado |
| `sequence-ordering`     | Sequence Ordering          | Carrera o cola; pistas “antes que”, “justo delante”, “primero/último”, “no es tercero”, “exactamente k entre”, “juntos / no juntos”                                                      | `ordering` (orden inicial barajado y distinto de la solución)                                                                             | 3 → 4 → 5 → 6 personas; de pistas que fijan posiciones a pistas solo relativas (sin “at” en el nivel 10)                                                                                                                                   | accuracy; orden completo exacto; pistas mínimas (ninguna sobra)                                                | implementado |
| `truth-and-falsehood`   | Truth and Falsehood        | Personajes que siempre dicen la verdad o siempre mienten; cada uno hace una afirmación (sobre otro, “somos iguales/distintos”, “al menos uno de X e Y…”, “exactamente k de nosotros…”)   | `single-choice` (“Truth-teller / Liar”, o “¿quién dice la verdad?” con grupos como distractores) y `numeric` (¿cuántos dicen la verdad?)  | 2 → 3 → 4 personajes; afirmaciones sobre una persona → comparaciones → recuentos del grupo → “al menos uno de” → todo mezclado; preguntas sobre uno → sobre el grupo → cuántos                                                             | accuracy; exactamente una asignación consistente (fuerza bruta 2ⁿ); nunca “soy un mentiroso”                   | implementado |
| `strategy-puzzle`       | Strategy Puzzle            | Juego de quitar monedas (una pila o varias, gana quien coge la última), jarras de agua, fichas deslizantes 2×2 / 2×3                                                                     | `single-choice` (jugada ganadora; exactamente una existe) y `numeric` (mínimo de movimientos)                                             | quitar 1–2 → fichas 2×2 → dos jarras con grifo → quitar 1–3 → fichas 2×3 → jarras más largas → dos pilas → fichas largas → tres jarras sin grifo → tres pilas + mezcla                                                                     | accuracy; búsqueda exhaustiva de juego (memo) o BFS                                                            | implementado |
| `algorithmic-reasoning` | Algorithmic Reasoning      | Un robot en una cuadrícula sigue instrucciones en lenguaje llano (avanzar, girar, “haz esto N veces”, “si delante hay pared…”, “sigue hasta que algo te bloquee”); señalar dónde se para | `locate` (la vista dibuja la cuadrícula con `CellGrid`; cada celda con nombre “row r, column c”)                                          | 4×4 sin paredes → paredes → repeticiones → “hasta bloquear” → “si hay pared” → combinaciones → repeticiones anidadas → 6×6 y 7×7 con más paredes y programas más largos                                                                    | accuracy; simulación exacta; se rechazan programas que chocan con una pared en un “avanzar”                    | implementado |
| `multi-step-logic`      | Multi-Step Logic Challenge | Hechos encadenados sobre edades o canicas (“k más que”, “el doble que”, totales) o alturas (“más alto que”); varios pasos hasta la respuesta                                             | `numeric` (valor o diferencia) y `single-choice` (quién es el mayor / el más alto / el más bajo)                                          | 1 paso con 2 personas → cadenas de 3 → comparaciones de altura → “doble / mitad” → 4 personas → totales en vez de un valor conocido → diferencias entre personas no comparadas directamente → 5 personas mezclando números y comparaciones | accuracy; backtracking sobre todos los valores 1..máx (o todos los órdenes) confirma que la respuesta es única | implementado |

## Garantías comunes

- **Respuesta calculada por un solver**, nunca supuesta, y comprobada en los tests con un oráculo
  escrito por separado: tabla de verdad con máscaras de bits (Conditional), Nim por XOR y BFS
  propios (Strategy), intérprete del robot con otra representación (Algorithmic), diferencias
  finitas (Number Sequences), fuerza bruta sobre todas las tablas / órdenes / asignaciones
  (Deduction, Ordering, Truth, Multi-Step), backtracking con límite 5 (Constraint).
- **Unicidad**: todo candidato ambiguo o sin solución se descarta con `retryGeneration`. Number
  Sequences ajusta una biblioteca de 12 reglas (aritmética, geométrica, mitades, pasos alternos,
  diferencias crecientes, cúbica, intercaladas, ×r+b y +b×r alternos, r·x+b, suma de los dos
  anteriores, periodo 2) y exige que todas las que encajan con lo visible predigan el mismo término.
  Rule Discovery comprueba todas las reglas de las familias consideradas en el nivel.
- **Sin distractores adivinables**: las opciones son el conjunto completo (personas, valores,
  veredictos, jugadas) o muestras independientes de la respuesta; el contrato comprueba que la
  posición de la respuesta no está sesgada. Las respuestas abiertas usan `numeric`.
- **Explicaciones** generadas por el propio solver: tabla solución, cadena de deducciones, mundos
  de ejemplo para “Can't tell”, camino óptimo de jarras o fichas, traza del robot.
- **Accesibilidad**: todo el estímulo es texto o lleva nombre accesible (celdas “row r, column c”,
  monedas “Pile A: 5 coins”, glifos “blue star”, marcas ✓/✗ además del color); la vista solo tiene
  botones en Algorithmic Reasoning, recorribles con flechas desde el escenario.

## Limitaciones conocidas

- **Rendimiento**: Logical Deduction en los niveles 8–10 (unas 14 000 tablas posibles) tarda unos
  5–7 ms por desafío en un equipo cargado; la media de los 10 niveles queda en ~2 ms, por debajo
  del presupuesto de 5 ms. El test de tiempo de `logic.test.ts` toma el mejor de tres pasadas para
  no fallar por carga ajena, pero en una máquina muy saturada podría ser inestable.
- **Explicaciones**: en Logical Deduction, Sequence Ordering y Constraint Solver la explicación
  muestra la solución única y que todas las pistas se cumplen, no una cadena de deducciones paso a
  paso. Multi-Step sí la da paso a paso cuando hay un valor conocido.
- **Conditional Reasoning** a veces formula reglas con doble negación (“… unless the lamp is not
  on”); son correctas pero exigentes de leer. La explicación recuerda qué significa “unless”.
- **Algorithmic Reasoning** puede terminar con giros que no cambian la casilla final (actúan como
  distractores); la respuesta pide solo la casilla, no la orientación.
- **Strategy Puzzle**: las fichas deslizantes se limitan a 2×2 y 2×3 (la tabla BFS completa de 3×3
  sería demasiado cara de generar).
- No hay modo de pista ni de “mostrar un paso”; los juegos no tienen fase de estudio.
