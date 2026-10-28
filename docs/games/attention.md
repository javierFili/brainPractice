# Categoría Attention (Atención y concentración)

Diez juegos de atención, registrados en `src/games/attention/index.ts` en este orden. Todos son
**sin límite de respuesta** (`limitMs: null`): atención ≠ velocidad. Solo hay tiempo donde la
exposición breve _es_ la tarea: la fase de estudio de Change Detection y Dual-Task Attention, y el
ritmo de presentación de Target Tracking y Sustained Attention Challenge (nunca más rápido que un
cambio cada 0,7 s, sin parpadeos; el modo relajado ralentiza ×1,5 o ×2). Todos miden `accuracy`.
Contenido puro en `content/`, vista en `ui/`, tests en `<slug>.test.ts(x)` (contrato + oráculo
independiente en todos los niveles × 30–40 semillas + progresión + interacción con usuario simulado
y temporizadores falsos). Generación media 0,4–1,3 ms por challenge.

Ayudantes compartidos en `src/games/attention/shared/`:

- `content/marks.ts`: `Mark` = glifo del kit + pose (`rotation`, `mirrored`) + una forma asimétrica
  propia (`ell`, una L) para que el espejo importe (las formas del kit son simétricas
  izquierda-derecha). `canonicalMark`/`markKey`/`sameLook` pliegan las poses que no se ven (un
  círculo girado es el mismo círculo), así que las comprobaciones de unicidad comparan lo que se ve.
  `markLabel` nombra color, forma y pose ("blue triangle, turned right", "green L shape, mirrored"):
  dos marcas que se ven distintas siempre tienen nombres distintos. `changeMark` cambia exactamente
  un rasgo (color, forma, giro, espejo), con variante sutil (color vecino, contorno parecido, cuarto
  de vuelta).
- `content/grid.ts`: `cellName`, `countWhere`, `indicesWhere`, `listWords`.
- `ui/MarkFace.tsx`: dibuja una marca (Glyph del kit con `pose`, o la L).

| id                              | Nombre                        | Mecánica                                                                                                                                                                                             | Formato                                              | Qué varían los 10 niveles                                                                                                                                                                                                | Puntuación / medidas                                                                                             | Estado       |
| ------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------ |
| `odd-one-out`                   | Odd One Out                   | Cuadrícula de marcas idénticas salvo una; señalarla                                                                                                                                                  | `locate`                                             | 3×3 → 6×8; diferencia de color → forma → contorno parecido → giro → color vecino → cuarto de vuelta → L espejada → cualquier rasgo sutil                                                                                 | accuracy; correcto si se señala la única distinta (oráculo: exactamente 2 aspectos, uno con 1 aparición)         | implementado |
| `visual-difference`             | Visual Difference             | Dos dibujos de marcas (lado a lado, apilados en móvil); marcar en el derecho las K diferencias                                                                                                       | `multi-select` (número exacto anunciado)             | 3×3 → 6×6; K 1 → 6; paleta 3 → 10 marcas; color/forma → giros → espejo; cambios sutiles desde nivel 6                                                                                                                    | accuracy; exacto (sin tolerancia)                                                                                | implementado |
| `target-tracking`               | Target Tracking               | "Sigue la carta": cartas boca arriba con la(s) marcada(s), se tapan y se intercambian por pares en pasos discretos (arco + texto "cards 2 and 4 change places", sin movimiento); señalar dónde acabó | `locate`                                             | 3 → 6 cartas; 2 → 10 intercambios; 2 s → 1 s por intercambio; desde nivel 7 seguir dos cartas (la pregunta nombra una al final)                                                                                          | accuracy; la carta preguntada siempre se mueve y no acaba donde empezó                                           | implementado |
| `distractor-filtering`          | Distractor Filtering          | Marcar todos los objetivos de una regla entre distractores parecidos                                                                                                                                 | `multi-select`                                       | un rasgo (todas las X / todo lo azul) → conjunción forma+color; 30 % → 100 % de distractores que comparten un rasgo; colores/contornos vecinos; desde nivel 7 sin número anunciado; desde nivel 8 1 error tolerado       | accuracy; fallos + marcas erróneas ≤ `maxErrors` (objetivos siempre > 3·maxErrors: no responder nunca aprueba)   | implementado |
| `change-detection`              | Change Detection              | Escena (fase de estudio) → tablero en blanco 0,9–1,2 s → segunda escena: ¿cambió algo?                                                                                                               | `single-choice` sí/no en orden fijo (1 = sí, 2 = no) | 3 → 12 ítems; aparición/desaparición → color/forma → movimiento → giro → cambios sutiles; exposición 3 s → 2 s                                                                                                           | accuracy; ~50 % de ensayos sin cambio (moneda justa por challenge; test comprueba 40–60 %)                       | implementado |
| `symbol-counting`               | Symbol Counting               | Contar copias exactas de un símbolo entre parecidos                                                                                                                                                  | `numeric`                                            | 16 → 48 ítems; 3–5 → 10–15 objetivos; de rellenos distintos a parecidos de color, contorno, dirección y L espejada (0 → 100 % de parecidos)                                                                              | accuracy; número exacto                                                                                          | implementado |
| `error-detection`               | Error Detection               | Corrección de listas cotidianas: lista ordenada, ticket de compra (cantidad × precio, total), horario (minutos vs horas), ortografía, códigos copiados; exactamente una fila mal                     | `locate`                                             | 5 → 10 filas; un tipo por nivel → mezcla; desde nivel 7 errores pequeños (10 céntimos, 5 minutos, 0/O, 8/B), ticket con TOTAL, palabras en orden alfabético                                                              | accuracy; el solver confirma un único error (lista ordenada: la única fila cuya retirada deja la lista ordenada) | implementado |
| `sustained-attention-challenge` | Sustained Attention Challenge | CPT: letras una a una durante la respuesta; "Now!"/Espacio/Enter registra la posición en pantalla; al acabar se envía solo                                                                           | `multi-select` sin número, `maxErrors` 0–2           | 15 → 45 letras; 1,5 s → 0,8 s por letra; "cada X" → "X justo después de A" (nivel 5+) con señuelos (X sola, A sin X); letras parecidas (K, Y, V)                                                                         | accuracy; fallos + pulsaciones erróneas ≤ tolerancia                                                             | implementado |
| `dual-task-attention`           | Dual-Task Attention           | Pares número + forma uno a uno (fase de estudio); llevar dos cuentas (p. ej. pares y estrellas) y elegir la opción con ambas bien                                                                    | `single-choice` de 4 = 2×2 de candidatos por cuenta  | 6 → 20 pares; 1,6 s → 0,9 s; par → >5 → impar → dos cifras; forma → forma de un color; formas parecidas; candidatos separados 2 → 1                                                                                      | accuracy; la evaluación es exacta y acertar solo una cuenta deja un 50 % (test de centroide ≈ azar)              | implementado |
| `complex-visual-inspection`     | Complex Visual Inspection     | Cuadrícula densa; marcar los ítems que cumplen forma + color + dirección (y espejo con la L)                                                                                                         | `multi-select`                                       | 4×4 → 6×8; 2 → 4 direcciones; 3 → 6 colores; entra la L; señuelos que rompen un solo rasgo 60 → 95 %; colores vecinos; sin número desde nivel 7; regla negada "cualquier color salvo X" desde nivel 8 (1 error tolerado) | accuracy; objetivos = filtro de la regla sobre el aspecto canónico                                               | implementado |

## Limitaciones conocidas

- **Color**: Odd One Out (niveles 1, 2, 6), Visual Difference, Distractor Filtering, Change
  Detection, Symbol Counting, Dual-Task (desde nivel 6) y Complex Visual Inspection tienen
  diferencias o reglas solo de color. Cada celda tiene nombre accesible con color, forma y pose,
  así que un lector de pantalla puede compararlas, pero jugando a la vista hace falta distinguir
  colores (indicado en `accessibilityNotes`). Las diferencias de color "sutiles" usan colores
  vecinos (rojo/naranja…), difíciles con discromatopsias.
- **Pose**: las formas del kit son simétricas izquierda-derecha, por eso el espejo solo se usa con
  la L propia. El rombo se trata como totalmente simétrico (su caja es 84×88, casi cuadrada).
- **Error Detection / ortografía**: el diccionario es `ALL_WORDS` del kit; una errata se rechaza si
  coincide con una palabra de esa lista, pero podría coincidir con otra palabra inglesa real fuera
  de ella (raro: solo transposición, duplicación, omisión o vocal cambiada en palabras de ≥ 4
  letras). Tickets y horarios exigen aritmética sencilla.
- **Change Detection**: el sí/no es una moneda justa por challenge; una sesión concreta de 6 puede
  salir desequilibrada. Las opciones se muestran ya durante el tablero en blanco (las dibuja el
  escenario); la instrucción pide esperar a la segunda vista.
- **Streams** (Sustained Attention, Dual-Task): una pulsación cuenta para la letra visible en ese
  momento; una pulsación tardía cae en la siguiente. Dual-Task se reproduce en la fase de estudio:
  "I'm ready" la corta antes de tiempo (decisión del jugador).
- **Target Tracking**: las cartas tapadas son idénticas; la información de cada intercambio es el
  arco resaltado y el texto anunciado (no hay animación de desplazamiento).
- Las pruebas fallidas de `src/features/*` durante este trabajo provienen de la reescritura de UI
  en curso en otra sesión; los juegos solo se validaron en `src/games/attention`.
