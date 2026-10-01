# Testing

```bash
npm test            # all tests once (Vitest + jsdom)
npm run test:watch  # watch mode
npm run coverage    # tests + coverage report (text + coverage/index.html) with thresholds
```

## Qué se prueba y dónde

| Capa           | Ubicación                        | Foco                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain         | `src/domain/**/*.test.ts`        | Evaluación de respuestas para cada formato y entradas mal formadas, fórmulas de scoring (nivel 1/10, puntuación 0, máximo, t = 0, reintentos, penalizaciones), umbrales y límites de la dificultad, métricas (vacías, abandonadas, medianas, pace), seeds (entradas inválidas, valores golden), actualización del progreso y guardas sobre datos persistidos, puntuación del assessment. |
| Engine         | `src/engine/*.test.ts`           | Sesiones completas con `FakeClock`: correct/incorrect/time-out, respuestas justo en el límite y después de él, tiempos de la fase de estudio, envíos dobles, comandos fuera de orden, finalización anticipada, suscripciones, overrides del scoring, orquestación del assessment.                                                                                                        |
| Game content   | `src/games/*/content/__tests__/` | Para cada nivel × decenas de seeds: determinismo, validez, la solución se acepta, un **solver independiente** confirma exactamente una respuesta correcta, los distractores son distintos, las explicaciones contienen la respuesta y las tablas de niveles nunca se vuelven más fáciles.                                                                                                |
| Game UI        | `src/games/*/ui/*.test.tsx`      | Content views: qué es visible en cada fase, interacciones `locate`, marcadores de revisión.                                                                                                                                                                                                                                                                                              |
| Infrastructure | `src/infrastructure/*.test.ts`   | Ida y vuelta por localStorage, recuperación parcial de datos dañados con copia de seguridad, storage bloqueado (fallback a memoria), fallos del almacenamiento.                                                                                                                                                                                                                          |
| Application    | `src/features/**/*.test.tsx`     | Comportamiento a través de las rutas reales: responder actualiza el feedback y la puntuación, atajos de teclado, temporizadores que expiran (fake timers), validación de la entrada numérica, reproducción por seed, selección de nivel, reinicio del progreso, flujo del assessment.                                                                                                    |

Además (Phases 2–6):

| Capa              | Dónde                                                               | Qué protege                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pseudocódigo      | `src/domain/pseudocode/*.test.ts`                                   | Semántica (precedencia, ramas, bucles, funciones, recursión), errores para principiantes con línea, límites, traza, que nombres como `constructor` no lleguen al host.                                                                     |
| Learning          | `src/domain/learning/*.test.ts`, `src/engine/LessonSession.test.ts` | Feedback por tipo (correcto/parcial/incorrecto/respuesta inválida), mastery, Leitner, desbloqueos, máquina de estados de la lección (reintentos, pistas, revelar, checkpoint, doble envío), validador de contenido, recuperación de datos. |
| Curriculum        | `src/content/programming-logic/course.test.ts`                      | Cada lección cumple los invariantes pedagógicos y **cada respuesta se ejecuta** en el intérprete.                                                                                                                                          |
| Perfil e insights | `src/domain/profile`, `src/domain/insights`                         | Hábitos (semana, racha sin castigo), daily determinista, perfil cognitivo, recomendaciones explicadas.                                                                                                                                     |
| Integración Learn | `src/features/learn/learn.test.tsx`                                 | Lección completa con los 7 tipos → mastery → desbloqueo → persistencia; error con diagnóstico, pista y reintento; revelar; bloqueos; ruta y repaso.                                                                                        |
| Plataforma        | `src/features/dashboard/dashboard.test.tsx`                         | Dashboard, onboarding, daily.                                                                                                                                                                                                              |
| Accesibilidad     | `src/features/play/accessibility.test.tsx`                          | Flechas entre ítems, confirmación táctil, radiogroup de niveles, opciones descritas.                                                                                                                                                       |

Los timeouts globales (`testTimeout` 15 s, `asyncUtilTimeout` 3 s) absorben la carga de ejecutar todos
los archivos en paralelo; la única flakiness detectada venía de ahí.

## Principios

- **Comportamiento antes que implementación.** Los tests de UI usan roles y texto visible (`getByRole`,
  `user-event`), nunca detalles internos de los componentes ni snapshots.
- **Determinismo.** El tiempo viene de `FakeClock` (o de fake timers + un reloj basado en `Date.now` en los
  tests de temporizadores); la aleatoriedad, de seeds (`FixedSeedSource`). Ningún test depende del reloj
  real ni de `Math.random`.
- **Tests de propiedades sin dependencias extra.** El contenido se comprueba sobre rangos de seeds por
  nivel. `fast-check` añadiría shrinking; por ahora no hace falta.
- **Invariantes de medición.** Que haya _una_ respuesta correcta no basta: además, no debe poder
  encontrarse sin resolver el ejercicio. `src/test/guessability.ts` simula a un jugador que no lee el
  material (elige la opción "centroide", la mediana, evita los extremos) y cada juego de elección
  múltiple comprueba que esas heurísticas no superan el azar en más de 15 puntos (`__tests__/measurement.test.ts`).
  Bug Hunter comprueba además que la posición del bug no da información. Estos tests se añadieron en
  Phase 1 tras encontrar respuestas adivinables en Logic y Code Memory (ver `docs/product-audit.md`).
- **Oráculos independientes.** Los tests de juego verifican las respuestas con solvers que no reutilizan la
  decisión del generador (p. ej. resolución de restricciones por fuerza bruta, un intérprete, un
  comprobador de reglas aparte).

## Cobertura

Los umbrales (en `vite.config.ts`) se aplican a las capas que contienen reglas de negocio: `src/domain/**` y
`src/engine/**` exigen ≥ 90 % de statements/functions/lines y ≥ 85 % de branches. La UI no tiene umbral
numérico; su cobertura se juzga por los flujos de usuario probados. Perseguir el 100 % no es un objetivo.

## Helpers de test

| Helper                                  | Uso                                                                                                               |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `test/fakes/FakeClock`                  | Reloj que se avanza manualmente.                                                                                  |
| `test/fakes/FixedSeedSource`            | Seeds de sesión deterministas.                                                                                    |
| `test/fakes/InMemoryProgressRepository` | Puerto de progreso sin almacenamiento.                                                                            |
| `test/fixtures/fixtureGame`             | Juego mínimo para tests de engine/dominio; `buildLevelTable` para tablas rápidas.                                 |
| `test/fixtures/results`                 | Factoría de `GameResult`.                                                                                         |
| `test/renderApp`                        | `renderApp(path)` renderiza la app real; `renderWithServices(element)` renderiza un elemento con los providers.   |
| `test/guessability`                     | Heurísticas de adivinación (centroide, mediana, extremos) y distancias (`levenshtein`, `orderDistance`).          |
| `test/fixtures/learningCourse`          | Curso de 2 lecciones válido para tests de dominio, engine y UI.                                                   |
| `test/fakes/InMemoryRepository`         | `Repository<T>` en memoria para cualquier slice.                                                                  |
| `test/challenges`                       | El challenge que mostrará una sesión con un seed dado; etiquetas de las opciones; seeds para un formato concreto. |
