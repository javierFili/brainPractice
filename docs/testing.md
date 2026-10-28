# Estrategia de tests

La guía original (helpers, cobertura, convenciones) sigue en [../TESTING.md](../TESTING.md). Este
documento resume lo añadido en la plataforma general.

## Capas

| Capa              | Qué se prueba                                                                                                                                                                                                                         | Dónde                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Formatos          | evaluación, validación y errores de `sequence`, `multi-select`, `pairs`, `tap`; `solutionAnswer`                                                                                                                                      | `domain/challenge/interactiveFormats.test.ts` |
| Métricas          | tiempo de reacción separado del de respuesta                                                                                                                                                                                          | `domain/session/performanceMetrics.test.ts`   |
| Progreso          | esquema v2, migración v1→v2, totales rehechos, desbloqueo (nunca bloquea, contiguo, modo libre)                                                                                                                                       | `domain/progress/progress.test.ts`            |
| Preferencias      | recuperación campo a campo, defaults, versión futura, defaults por ruta                                                                                                                                                               | `domain/preferences/preferences.test.ts`      |
| Insights          | recomendaciones, continuar, sesiones rápidas (duración, variedad, reproducibilidad), comparaciones válidas, tendencias, hitos                                                                                                         | `domain/insights/training.test.ts`            |
| Contrato de juego | registro, reproducibilidad, solución aceptada, variedad, sin sesgo de posición, vista en todas las fases (por cada uno de los 60 juegos)                                                                                              | `test/gameContract.tsx` + `<juego>.test.tsx`  |
| Juegos            | oráculo independiente / unicidad en todos los niveles y muchas semillas, progresión, interacción con user-event                                                                                                                       | `src/games/**`                                |
| Catálogo          | ≥ 10 juegos por categoría, rutas y protocolos sólo con juegos existentes, colecciones no vacías, copy sin términos diagnósticos                                                                                                       | `games/catalog.test.ts`                       |
| UI                | las 29 entradas del sidebar llevan a pantallas con `h1`, sidebar contraíble persistido, drawer móvil, dashboard nuevo/recurrente, filtros, desbloqueo, modo libre, progreso, reset con confirmación, rutas, accesibilidad, onboarding | `features/pages.test.tsx`                     |
| Integración       | Dashboard → área → juego → nivel → partida → respuestas → resultados → guardado → inicio                                                                                                                                              | `features/play/fullFlow.test.tsx`             |

## Reglas

- Sin esperas reales: `vi.useFakeTimers()`, `FakeClock`, `now` inyectable en `TapStage`.
- Semillas fijas (`FixedSeedSource`, `deriveSeed`), nunca `Math.random`.
- Tests de comportamiento: se interactúa como un usuario (roles y nombres accesibles).

## Comandos

```bash
npm test            # todo
npm run coverage    # con umbrales en domain/ y engine/ (COVERAGE=1 omite presupuestos de tiempo)
npx vitest run src/games/memory   # una categoría
```

Nota: con muchos procesos en paralelo, algún test de UI largo puede rozar el timeout de 15 s de
`vite.config.ts`; en una ejecución normal pasan con margen.
