# Scoring y métricas

Implementación: `src/domain/scoring/standardScoring.ts`, `src/domain/session/performanceMetrics.ts`.

## Por challenge

Cada challenge termina como `correct`, `incorrect`, `timed-out` o `skipped`.

```
m(L)       = 1 + 0.25 · (L − 1)                       multiplicador de nivel
correcto   = B · m(L) · (1 + s + z) · a               B = 100
  s = Smax · max(0, 1 − t / objetivo)                 bonus de ritmo (Smax = 0.5 por defecto)
  z = min(0.05 · racha previa, 0.25)                  bonus de racha
  a = 0.5^(intentos − 1)
incorrecto = −0.25 · B                                penalización moderada
timed-out / skipped = 0
```

## Por sesión

```
precisión        = correctas / intentadas            (las saltadas no cuentan como intentadas)
índice de ritmo  = Σ_correctas ritmo / intentadas     (el ritmo sólo cuenta en aciertos)
rendimiento      = round(100 · (w · precisión + (1 − w) · ritmo))      w = 0.75 por defecto
```

La precisión domina siempre. Los juegos ajustan los pesos cuando la velocidad es el objeto:

| Juegos                                | Ajuste                                      | Motivo                                                                 |
| ------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| Velocidad (9 juegos), Code Comparison | `maxSpeedBonus 1`, `accuracyWeight 0.6`     | la velocidad es la habilidad practicada                                |
| Reaction Test                         | `maxSpeedBonus 0.25`, `accuracyWeight 0.85` | el objetivo incluye la espera; el tiempo de reacción se informa aparte |
| Resto                                 | por defecto (0.75 / 0.25)                   | precisión primero                                                      |

La pantalla de resultados muestra los pesos reales del juego, no un texto fijo. En juegos sin
límite el tiempo se muestra "sólo como información" y el resultado sigue siendo válido.

## Métricas

`total, attempted, correct, incorrect, timedOut, skipped, accuracy, averageResponseMs,
medianResponseMs, fastestResponseMs, medianPace, medianReactionMs, longestStreak, byKind, bySkill`.

- **Tiempo de respuesta**: desde que se abre la ventana de respuesta (tras la fase de estudio).
- **Tiempo de reacción** (`tap`): desde la aparición de la señal hasta el toque, sólo aciertos.
  Separado del tiempo de respuesta, que incluye la espera.
- Cada juego declara en `meta.measures` qué métricas tienen sentido; la UI sólo muestra esas.

## Qué se muestra después de cada sesión

Resultado, aciertos/fallos, precisión, tiempo (si procede), nivel, récord del nivel, comparación con
la sesión comparable anterior, "algo para practicar" (el tipo de challenge con menor acierto,
nombrado como práctica, nunca como déficit), recomendación de nivel y revisión de errores con
explicación.

## Assessment

`area = Σ m(L) · PI' / Σ m(L)` con `PI' = PI · intentadas / total` (saltar cuenta como no resuelto);
índice global = media de áreas medidas. Es un **índice interno de esta plataforma**: sin normas
poblacionales, sin percentiles, sin IQ. Margen aproximado ±98/√ítems mostrado siempre.
