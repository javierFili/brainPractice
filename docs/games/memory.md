# Categoría Memory

Diez juegos de memoria, registrados en `src/games/memory/index.ts` en este orden. Todos son
**sin límite de tiempo** (`limitMs: null`): la fase de estudio (`timing.studyMs`) es lo único
temporizado y el modo relajado la duplica. Contenido puro en `content/`, vista en `ui/`, tests en
`<slug>.test.tsx` (contrato + oráculo + progresión + interacción). Ayudantes compartidos de la
categoría en `src/games/memory/shared/` (`content/`: `cellName`, `objectById`, `ordinal`,
`orderingResponse`; `ui/`: `renderNamedOption`, `HiddenNote`).

| id                      | Nombre                | Mecánica                                                                                                       | Formato de respuesta                                                                                                                 | Qué varían los 10 niveles                                                                                                                                                                             | Puntuación / medidas                                                             | Estado       |
| ----------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------ |
| `memory-cards`          | Memory Cards          | Cartas boca abajo; encontrar parejas con un presupuesto de fallos                                              | `pairs`                                                                                                                              | 3→12 parejas; vista previa que se acorta y desaparece; objetos → familia → formas → formas casi iguales; menos fallos permitidos                                                                      | accuracy, completion-time; tablero resuelto si todas las parejas con ≤ maxMisses | implementado |
| `sequence-recall`       | Sequence Recall       | Secuencia de símbolos uno a uno; reconstruirla en la paleta                                                    | `sequence`                                                                                                                           | longitud 3→9; menos tiempo por ítem; orden inverso desde nivel 4; paletas mixtas y repeticiones                                                                                                       | accuracy, streak; secuencia exacta                                               | implementado |
| `position-memory`       | Position Memory       | Celdas iluminadas a la vez; marcar las mismas                                                                  | `multi-select`                                                                                                                       | cuadrícula 3×3→6×6; 2→8 objetivos; desde nivel 5 distractores naranjas a ignorar                                                                                                                      | accuracy; cuadrícula exacta                                                      | implementado |
| `object-recall`         | Object Recall         | Estudiar objetos cotidianos (emoji + nombre); reconocerlos en un tablero el doble de grande con objetos nuevos | `multi-select` (número exacto)                                                                                                       | 3→10 objetos estudiados, tablero 6→20; menos tiempo por objeto; desde nivel 4 los nuevos son de las mismas familias (2→3 familias)                                                                    | accuracy; tablero correcto si se marcan exactamente los estudiados               | implementado |
| `number-recall`         | Number Recall         | Números troceados (teléfono, código, billete…)                                                                 | `numeric` (escribirlo) y `single-choice` (qué trozo iba en la posición k)                                                            | 4→12 dígitos retenidos; escribir el número → elegir trozo por posición → dos números etiquetados a la vez (se pregunta uno) → mezcla                                                                  | accuracy; número exacto o trozo correcto                                         | implementado |
| `word-recall`           | Word Recall           | Palabras una a una; reconocerlas entre palabras nuevas, u ordenarlas                                           | `multi-select` y `ordering`                                                                                                          | 4→10 palabras, más rápidas; desde nivel 4 señuelos del mismo tema; desde nivel 6 tolerancia de 1 desliz (sin número exacto); desde nivel 7 listas de 5→7 a reordenar                                  | accuracy; aciertos dentro de `maxErrors`, u orden exacto                         | implementado |
| `visual-changes`        | Visual Changes        | Cuadrícula de glifos; vuelve con un único cambio                                                               | `locate` (cambio de color/forma) y `multi-select` de 2 (intercambio)                                                                 | 4→16 ítems, 3×3→6×6; color → color o forma → paleta parecida (3 formas × 3 colores) → intercambio de dos ítems; menos tiempo por ítem                                                                 | accuracy; señalar el ítem cambiado (o los dos intercambiados)                    | implementado |
| `association-memory`    | Association Memory    | Aprender parejas y responder "¿qué iba con X?"                                                                 | `single-choice` (opciones sacadas del propio conjunto aprendido)                                                                     | 3→8 parejas; objeto↔color → glifo↔objeto → palabra↔número; asociados parecidos (misma familia, glifos casi iguales, números con los mismos dígitos); dirección inversa y luego mezclada; 3→5 opciones | accuracy; elegir el asociado correcto                                            | implementado |
| `working-memory-grid`   | Working Memory Grid   | Luces una a una en una cuadrícula, longitud de serie desconocida; hay que actualizar                           | `multi-select` (últimas K) y `locate` (la luz N pasos antes de la última)                                                            | cuadrícula 3×3→5×5; serie 3–4 → 9–11; K 2→5; N 1→4; preguntas mezcladas desde nivel 6; ritmo más rápido                                                                                               | accuracy; marcar exactamente las K últimas o señalar la celda correcta           | implementado |
| `dual-memory-challenge` | Dual Memory Challenge | Objetos aparecen uno a uno, cada uno en su celda; la pregunta sondea lugar u orden al azar                     | `locate` (¿dónde estaba X? / ¿dónde estaba el n-ésimo?) y `single-choice` (¿cuál salió n-ésimo? / ¿cuál estaba en la celda marcada?) | 3→8 objetos; 3×3→5×5; 2 → 3 → 4 tipos de pregunta; objetos de una sola familia desde nivel 6; ritmo más rápido                                                                                        | accuracy; cada nivel incluye preguntas de lugar y de orden                       | implementado |

## Garantías comunes de los juegos nuevos

- Respuesta calculada por código y verificada en los tests con un oráculo independiente para
  todos los niveles y muchas semillas (p. ej. Working Memory Grid recalcula la ventana de luces
  recientes; Visual Changes recalcula las diferencias celda a celda).
- Ambigüedad descartada con `retryGeneration`: números distintos cuando hay dos, últimas K luces
  distintas, luz N-atrás distinta de la última, intercambios entre glifos diferentes, etiquetas de
  parejas únicas.
- Distractores no adivinables: en `single-choice` todas las opciones son elementos vistos (otros
  trozos del número, otros asociados, otros objetos mostrados) o señuelos independientes de la
  misma longitud; el contrato comprueba que la posición de la respuesta no está sesgada.
- Ningún trozo numérico empieza por 0, así que escribir el número nunca pierde un dígito.
- Color nunca es la única pista: los glifos combinan forma y color y su etiqueta los nombra; los
  colores de Association Memory se muestran con su nombre.
- Presentaciones secuenciales (`useStepper`) con un hueco oscuro entre luces/objetos: como mucho
  ~1,2 cambios por segundo, nunca parpadeo rápido.

## Limitaciones conocidas

- Las presentaciones secuenciales (Word Recall, Working Memory Grid, Dual Memory Challenge) se
  anuncian con `aria-live`; un lector de pantalla lento puede ir por detrás del ritmo. El modo
  relajado ralentiza el ritmo ×1,5 y duplica el estudio, pero no hay control de pausa.
- `studyMs` de Word Recall y Working Memory Grid se calcula por challenge (longitud de la lista o
  de la serie); la `timing` del nivel es nominal.
- En Number Recall, la respuesta numérica se escribe sin espacios; `NumericResponse` no acepta
  separadores.
- Las cuadrículas de 6×6 (Visual Changes) usan celdas `sm` (~40 px a 360 px de ancho), en el
  límite inferior recomendado.
- Los textos de las palabras en tableros de 4 columnas usan `text-xs` en móvil; palabras largas
  ("library", "mountain") pueden partirse.
