# Sistema de dificultad

## Diez niveles por juego

Cada juego declara una `LevelTable<P>`: exactamente un perfil por nivel 1–10 (lo impone el tipo
`Record<DifficultyLevel, P>` y lo valida el registro al arrancar). El perfil común
(`DifficultyProfile`) tiene `level`, `tier`, `objective` (frase visible), `challengeCount` y
`timing { studyMs, limitMs, targetMs }`; cada juego lo extiende con parámetros tipados
(elementos, longitud, distractores, reglas, ayudas, alternativas…). `defineLevels()` construye la
tabla a partir de 10 filas.

| Tramo        | Niveles | Orientación                                                                    |
| ------------ | ------- | ------------------------------------------------------------------------------ |
| fundamentals | 1–3     | una regla, pocos elementos, sin presión, ayudas (vista previa, conteo visible) |
| intermediate | 4–6     | dos reglas o pasos, distractores controlados, menos ayudas                     |
| advanced     | 7–8     | relaciones múltiples, señuelos parecidos, menos redundancia                    |
| expert       | 9–10    | varios pasos, combinaciones exigentes, siempre verificables                    |

Los niveles se diferencian por la tarea, no sólo por números: p. ej. Memory Cards pasa de objetos
distintos con vista previa a parejas de formas casi iguales sin vista previa; Reaction Test de
reacción simple a go/no-go con señal cambiante.

Tests: el contrato comprueba registro y variedad por nivel; cada juego comprueba con
`expectNonDecreasing` que sus parámetros clave no retroceden.

## Desbloqueo

- Nivel 1 siempre abierto.
- Nivel n+1: tras una sesión completa de n con rendimiento ≥ 50, **o** tras 3 sesiones completas
  de n (constantes `UNLOCK_PERFORMANCE_INDEX`, `UNLOCK_AFTER_PLAYS`).
- **Modo libre** (Ajustes, activado por la ruta de programadores) abre todos los niveles.
- Un nivel está "superado" con rendimiento ≥ 70 (sólo sesiones completas y sin modo relajado).
- Nivel sugerido: el siguiente al más alto superado.

## Recomendación tras la sesión

`createRuleBasedDifficulty` (sin cambios): sube con precisión alta y buen ritmo, baja con
precisión baja, se queda en otro caso; siempre con una frase que explica por qué.

## Modo relajado

Sin límite de respuesta, el doble de tiempo de estudio, feedback que espera al jugador. Se guarda
en el historial pero no establece récords. Los juegos cuyo objeto es la velocidad lo indican
(`relaxedFriendly: false`).
