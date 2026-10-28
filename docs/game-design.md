# Diseño de juegos

Principios aplicados a los 60 juegos. El detalle por juego está en `docs/games/<categoría>.md`
(memory, logic, speed, attention, patterns, programming) y en `docs/game-design/*.md` para los cinco
juegos de programación originales.

## Un juego = una mecánica

Diez niveles de un juego no son diez juegos. Dentro de cada categoría las mecánicas se distinguen
por **lo que hace el jugador**: emparejar cartas ocultas, reproducir una secuencia, marcar
posiciones, reconocer entre señuelos, detectar un cambio, asociar, actualizar (n-back), sostener dos
informaciones… Cada juego define su propio contenido (unión discriminada por `kind`), sus
parámetros de nivel tipados, sus instrucciones y su `scoringSummary`.

## Retos correctos e inequívocos

- La respuesta la calcula un solver; los generadores descartan candidatos ambiguos o triviales
  (`retryGeneration`).
- Puzzles lógicos con solución única comprobada por fuerza bruta.
- Matrices y patrones: cada atributo determinado por una regla; distractores que violan al
  menos un atributo.
- Sin acertijos culturales ni dependientes de vocabulario raro; vocabulario de listas cerradas.

## Medición honesta

- Distractores no adivinables: la posición y el rango de la respuesta son uniformes; el contrato
  comprueba sesgo de posición; los juegos con opciones estructuradas tienen tests de
  "adivinabilidad" (centroide, mediana, extremos) en `src/test/guessability.ts`.
- La velocidad sólo es criterio donde la tarea trata de velocidad; en el resto no hay límite.
- Tolerancias explícitas (`maxErrors`, `maxMisses`) donde exigir perfección sería injusto (listas
  largas, flujos de 40 estímulos), siempre menores que el número de objetivos para que no marcar
  nada nunca puntúe.

## Feedback

- `explain` (lógica, patrones, programación): por qué la respuesta es correcta, generado desde el
  solver.
- `brief` (memoria, velocidad, atención): marca ✓/✗ con la respuesta correcta, avanza sola salvo en
  modo relajado.

## Para todas las edades

- `simpleInstructions` en una frase para la ruta de niños.
- Estímulos visuales con forma y color; objetos cotidianos con emoji y nombre.
- Nivel 1 siempre asequible y sin presión; la progresión llega por la tarea, no por el reloj.

## Cobertura del catálogo

Ver [game-catalog.md](game-catalog.md).
