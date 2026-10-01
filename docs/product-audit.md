# Product + Code Audit — Phase 0

> Fecha: 2026-09-30 · Commit auditado: `a5b0701` (main, árbol limpio) · Alcance: todo `src/`, configuración,
> tests y documentación. Hallazgos marcados **[V]** fueron verificados ejecutando código (muestreo de
> 400–2000 seeds por nivel y juego con scripts fuera del repo); **[C]** por lectura de código.
> Prioridades y plan en [improvement-roadmap.md](improvement-roadmap.md).

> **Estado tras Phase 1:** los P0 y los P1 de estabilización (P1-1 … P1-9) están corregidos y cubiertos
> por tests; ver "Resultado de Phase 1" en el roadmap. Este documento describe el estado **antes** de
> esos cambios.

## Executive Summary

La base técnica es **mucho mejor que la media de un MVP**: dominio puro de verdad (reforzado por
reglas de ESLint), máquina de estados de sesión pura con el tiempo inyectado en los eventos,
generación determinista por seed, validación de challenges, 397 tests que en su mayoría prueban
comportamiento, y lint/typecheck/test/build en verde.

Los problemas importantes **no son de arquitectura sino de medición y de producto**:

1. **Dos juegos tienen respuestas adivinables sin resolver el ejercicio** (P0). En Algorithmic Logic
   (dependency-order, L3+) una heurística que no lee el grafo acierta el 80–87 %; en Code Memory
   (preguntas de id/número) el 70–95 %. En una plataforma cuyo valor es "medir y entrenar", eso
   invalida precisión, recomendación de nivel y assessment para esos tipos.
2. **El assessment puede inflarse saltando** challenges difíciles, y presenta bandas
   ("Exceptional") con una precisión estadística que no tiene (±15 puntos con 6 ítems por área).
3. **La persistencia es frágil ante fallos**: un único registro corrupto descarta todo el progreso y
   la siguiente escritura lo sobrescribe; `localStorage` bloqueado rompe la app sin error boundary.
4. **Producto**: hoy es una colección de juegos bien hechos, sin razón para volver mañana: no hay
   onboarding, objetivo, daily challenge, historial de evolución ni aprendizaje. El pilar LEARN no
   existe.

Veredicto: **estabilizar la medición (P0/P1) y después construir LEARN encima de la arquitectura
actual**, sin reescribir. La arquitectura aguanta el crecimiento previsto.

| Área                   | Clasificación        |
| ---------------------- | -------------------- |
| Architecture           | Strong               |
| Code Quality           | Strong               |
| Testing                | Good                 |
| UX                     | Needs improvement    |
| Game Design            | Needs improvement    |
| Learning Design        | Critical (no existe) |
| Performance            | Good                 |
| Accessibility          | Good                 |
| Mobile                 | Needs improvement    |
| Product Value          | Needs improvement    |
| Retention              | Critical             |
| Monetization Readiness | Needs improvement    |

## Estado del repositorio

- `git status`: limpio. Rama única `main`, sincronizada con `origin/main`. 10 commits con mensajes
  convencionales, uno por feature (bootstrap → dominio → engine → 5 juegos → assessment → polish).
- Comandos: `npm run lint` ✔ (0 warnings, `--max-warnings=0`), `npm run typecheck` ✔,
  `npm test` ✔ (38 archivos, 397 tests, ~22 s), `npm run build` ✔, `prettier --check` ✔.
  Todos los scripts pedidos existen; no hubo que crear ninguno.
- Cobertura global 96 % statements / 90 % branches; umbrales de 90/85 % en `domain/` y `engine/`
  se cumplen. Puntos bajos: `features/results` 61 %, `features/play` 80 %, `infrastructure` 82 %.
- Stack real: React 19.3, React Router 7, Vite 8, Tailwind 4, Vitest 4, TS 5.9 con `strict`,
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`.
  ESLint `strictTypeChecked` + `no-explicit-any: error`.

## Architecture

**Clasificación: Strong.**

```text
features/ (React screens) ──► engine/ (GameEngine, GameSession, AssessmentEngine)
components/ (UI primitives)        │
app/ (composition root)            ▼
infrastructure/ ──implements──► domain/ (pure: session, scoring, difficulty, progress, random, time)
games/<id>/content (pure) ──► domain        games/<id>/ui (React) ──► games/<id>/content
```

| Aspecto              | Clasificación | Observación                                                                                                                                                                                                                                                                         |
| -------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain               | Strong        | Cero dependencias de React/DOM, **impuesto por ESLint** (`no-restricted-imports`, prohíbe `Math.random`, `Date.now`, `localStorage`, `window`) en `domain/`, `engine/` y `games/*/content`.                                                                                         |
| Application          | Good          | `engine/` hace de capa de casos de uso (fachadas con estado sobre reducers puros). La aplicación de resultados al progreso (`applySessionResult`) es pura pero se orquesta desde hooks de React (`usePersistResult`), lo que duplica el patrón get→apply→save en play y assessment. |
| Infrastructure       | Strong        | Puertos `ProgressRepository`, `Clock`, `SeedSource`; adaptadores mínimos. Un `ApiProgressRepository` no requiere tocar el dominio.                                                                                                                                                  |
| Game Engine          | Strong        | `GameDefinition` + `LevelTable` + `generate()`; un juego nuevo no toca el dominio.                                                                                                                                                                                                  |
| Challenge generation | Strong        | Punto único `generateChallenge` que valida la salida y la identidad; `retryGeneration` determinista.                                                                                                                                                                                |
| Scoring              | Strong        | Estrategia inyectable, fórmulas documentadas, desglose por challenge para la UI.                                                                                                                                                                                                    |
| Difficulty           | Strong        | `DifficultyStrategy` intercambiable; umbrales configurables con validación.                                                                                                                                                                                                         |
| State management     | Strong        | Una fuente de verdad por sesión (`useSyncExternalStore` sobre `GameSession`). Sin estado duplicado relevante. El progreso se relee en cada página (`useProgress`) sin caché compartida: simple y correcto hoy, pero no escala a Learning + Train + recomendaciones.                 |
| Components           | Good          | Ningún componente supera ~260 líneas; los `ContentView` por juego encapsulan el render. `ResultsView` (196) y `GameIntroPage` (190) mezclan layout y reglas de presentación, aceptable.                                                                                             |
| Hooks                | Good          | `useSessionLifecycle` solo pide transiciones; el reducer decide con el reloj. `usePersistResult` contiene lógica de aplicación (get→apply→save) que debería ser un caso de uso.                                                                                                     |
| Types                | Strong        | 0 `any`. Un único cast `as unknown as GameModule` (`games/types.ts:36`), documentado y justificado (borrado de tipo de módulos heterogéneos). Brands para ids.                                                                                                                      |
| Duplication          | Good          | Cada juego repite la forma `content/{definition,levels,generators,solvers,format,types}`: es convención, no duplicación. Duplicado real: `renderApp` y `createTestServices` en `test/renderApp.tsx`; get→apply→save en play y assessment.                                           |
| Coupling             | Good          | `features/results` importa `features/play/describe` y `PersistStatus`: acoplamiento lateral entre features, menor.                                                                                                                                                                  |
| Cohesion             | Strong        | Cada módulo tiene una responsabilidad clara y nombrada.                                                                                                                                                                                                                             |

**Deuda arquitectónica que Learning hará visible:**

1. `UserProgress` es un único blob con `schemaVersion: 1` y **sin migraciones**: cualquier cambio de
   esquema descarta todo el progreso del usuario (`progressGuards.ts:59`).
2. El intérprete de pseudocódigo vive dentro de `games/algorithmic-logic` y solo maneja números;
   Learning lo necesita como pieza compartida (ver [learning-engine-proposal.md](learning-engine-proposal.md)).
3. `GAME_MODULES` se importa de forma eager en `main.tsx`, por lo que todo el contenido de los cinco
   juegos está en el chunk inicial aunque las rutas sean lazy.

## Code Quality

**Clasificación: Strong.** Código legible, nombres precisos, comentarios que explican el porqué.

Bugs y riesgos encontrados:

| #   | Hallazgo                                                                                                                                                                                                                                                                         | Evidencia                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Q1  | [C] `LocalStorageProgressRepository.get()` llama a `storage.getItem` fuera del `try`; `window.localStorage` se accede en `main.tsx` sin protección. Con almacenamiento bloqueado (Safari con cookies bloqueadas, algunos iframes) lanza `SecurityError` → **pantalla de error**. | `infrastructure/LocalStorageProgressRepository.ts:16`, `main.tsx:15` |
| Q2  | [C] Datos corruptos: el guard es todo-o-nada; un único `SessionSummary` inválido descarta todo el progreso, y la siguiente sesión guardada **sobrescribe** el original (pérdida irreversible, sin copia).                                                                        | `progressGuards.ts:58-77`, `usePersistResult.ts:21`                  |
| Q3  | [C] No hay `errorElement` ni error boundary: cualquier excepción (p. ej. `GenerationExhaustedError`) muestra la página de error por defecto de React Router en inglés técnico.                                                                                                   | `app/routes.tsx`                                                     |
| Q4  | [C] Read-modify-write sin coordinación: dos pestañas pierden actualizaciones (la última escritura gana). Aceptable para demo; debe resolverse antes de sincronizar con API.                                                                                                      | `usePersistResult.ts`                                                |
| Q5  | [V] La primera frame de un challenge de Memory pinta el prompt y las opciones antes de la fase de estudio (`presenting` se mapea a `respond`).                                                                                                                                   | `features/play/ChallengeStage.tsx:23-28`                             |
| Q6  | [V] `inputMode="numeric"` no ofrece signo menos en iOS; ~25 % de las respuestas numéricas de Code Memory son negativas.                                                                                                                                                          | `components/response/NumericResponse.tsx:35`                         |
| Q7  | [C] Clase Tailwind construida en runtime (`hover:${meta.ring}`) nunca se genera: el hover por área del catálogo no funciona.                                                                                                                                                     | `features/catalog/CatalogPage.tsx:30`                                |
| Q8  | [C] "Reset progress" está deshabilitado si solo hay assessments guardados (condiciona a `recentSessions`).                                                                                                                                                                       | `features/profile/ProfilePage.tsx:60`                                |
| Q9  | [C] Una sesión terminada antes de tiempo con 1/1 aciertos muestra "Outstanding" (el índice ignora los skipped). No cuenta para récords, pero el titular engaña.                                                                                                                  | `features/results/ResultsView.tsx:20`                                |
| Q10 | [V] "Relaxed timing" quita el límite de respuesta pero no el de estudio.                                                                                                                                                                                                         | `domain/session/selectors.ts:8`                                      |

Sin hallazgos en: double submit (el reducer rechaza respuestas fuera de `responding`), timers y
unmount (cleanup correcto, los timers solo _solicitan_ transiciones y el reducer comprueba el
reloj), tiempo que retrocede (error explícito), memory leaks (listeners y intervals se limpian).

## Testing

**Clasificación: Good.** 397 tests; la mayoría prueban comportamiento observable:

- Dominio y engine: reducer, scoring, dificultad y progreso con casos límite; fakes de `Clock` y
  `SeedSource` en lugar de mocks.
- Contenido de juegos: **oráculos independientes** (Bug Hunter `__tests__/oracle.ts`, Pattern
  Architect `bruteForce.ts`, Code Scan re-diff del texto renderizado) que verifican unicidad de la
  respuesta sobre decenas de seeds por nivel.
- UI: la app real renderizada con reloj y seed deterministas (`renderApp`), consultas por rol.

Debilidades:

1. **Ningún test mide adivinabilidad ni sesgo posicional.** Por eso los dos P0 y el sesgo "el bug
   nunca es el ítem 1" pasaron con todo en verde: los tests prueban que _hay una_ respuesta correcta,
   no que _haga falta resolver_ para encontrarla.
2. El test de traza de Logic compara el generador con el mismo intérprete que usa (no independiente).
3. Tamaños de muestra pequeños (30–40 seeds por nivel) frente a los fallos observados con 400+.
4. Falta test de integración del flujo estudio → respuesta de Memory (el flash de Q5 no se detecta).
5. Falta test del exploit de skip en el assessment; el test del flujo _consolida_ guardar un
   assessment todo-skipped como 0/100.
6. Test con presupuesto de tiempo (`<20ms`) potencialmente frágil en CI.
7. Persistencia: no se prueba `getItem` que lanza ni la recuperación parcial.

## UX

**Clasificación: Needs improvement.**

- Bien: flujo juego → intro → nivel → sesión → resultados es claro; feedback inmediato con
  explicación; replay por seed; modo sin tiempo; foco gestionado.
- Falta: onboarding (la home no guía a una primera actividad), objetivo del usuario, "qué hago
  ahora" tras el resultado más allá de repetir/siguiente, historial de evolución (solo "best"),
  dashboard unificado. La home describe áreas pero no ofrece un primer paso de 2 minutos.
- Fricción: Bug Hunter y los juegos de locate responden con un único clic sin confirmar; ordenar 10
  elementos con botones ↑/↓ es tedioso; feedback de Logic sin traza paso a paso y vista de review
  vacía (el `ContentView` ignora `phase`).

## Game Design

Revisión como diseñador de juego y de entrenamiento cognitivo. Detalle por juego en
`docs/game-design/*.md`; aquí el diagnóstico.

| Juego             | Diversión | Progresión | Repetibilidad | Feedback | Dominio | Frustración | Claridad | Métricas       |
| ----------------- | --------- | ---------- | ------------- | -------- | ------- | ----------- | -------- | -------------- |
| Algorithmic Logic | Good      | Weak       | Good          | Weak     | Weak    | Good        | Good     | Needs redesign |
| Code Memory       | Good      | Good       | Good          | Good     | Weak    | Weak        | Good     | Needs redesign |
| Code Scan         | Good      | Good       | Good          | Good     | Good    | Weak (L10)  | Good     | Weak           |
| Bug Hunter        | Good      | Good       | Good          | Good     | Good    | Weak        | Good     | Good           |
| Pattern Architect | Good      | Weak       | Good          | Good     | Weak    | Weak (L8+)  | Good     | Good           |

Hallazgos clave:

- **Algorithmic Logic** — [V] P0: en dependency-order (L3+) los distractores son swaps adyacentes del
  orden válido, así que la opción "central" es la correcta (80–87 % vs 25 % de azar). [V] En
  program-trace L1–3, los distractores de relleno son `valor±1, ±2`: la respuesta casi nunca es la
  menor ni la mayor (196/196 en L1). [V] 28 % de los `if` de L2 tienen ramas idénticas, justo el
  nivel cuyo objetivo es "branching". Mezcla de tipos irregular (dependency-order desaparece en L8 y
  L10 pero está en L9). Feedback sin traza paso a paso.
- **Code Memory** — [V] P0: los distractores de ids/enteros son permutaciones y ±1/±10/±100 de la
  respuesta correcta; la opción "hub" es la correcta (70–95 % en ids). Carga crece bien en todos los
  ejes; secuencias L7–10 son todo-o-nada con 10 elementos (frustración). Feedback muy bueno.
- **Code Scan** — correcto en 10 000 muestras. Same-or-different es 50/50 y el bonus de velocidad
  `maxSpeedBonus: 1` hace que adivinar rápido tenga esperanza positiva en L1. "Condition negated"
  casi desaparece en L9–10. Mesetas L4/L5 y L6/L7.
- **Bug Hunter** — el mejor diseñado: progresión limpia (6 → 42 ítems, 1 → 3 reglas, near-misses),
  oráculo independiente. [V] En tipos de registros el bug nunca está en el ítem 1.
- **Pattern Architect** — correcto en 10 000 muestras (unicidad dentro del espacio de reglas
  declarado). Progresión débil: L1–3 fáciles, L7 cambia de contenido abruptamente, L9 ≈ L10; la
  promesa "menos evidencia" no se cumple. Feedback bueno, pero muestra programas de 3 pasos
  artificiosos como "the hidden program".

¿El nivel 10 es distinto del 1? **Sí en los cinco juegos**; la carga cognitiva crece de verdad. El
problema no es la escala sino que en algunos tipos se puede puntuar sin ejercer la habilidad.

¿Sensación de dominio? Débil: solo hay "best performance ≥ 70 = cleared". No se ve evolución en el
tiempo, ni por tipo de challenge a lo largo de sesiones.

## Learning Design

**Clasificación: Critical — no existe.** No hay lecciones, conceptos, mastery, repetición espaciada
ni contenido didáctico. Los juegos enseñan de forma incidental (explicaciones tras cada respuesta)
pero no hay progresión conceptual. Propuesta en [learning-engine-proposal.md](learning-engine-proposal.md).

## Performance

**Clasificación: Good.**

- Bundle: chunk inicial 371 kB (116 kB gzip) + React 101 kB. Contiene el contenido de los cinco
  juegos porque `GAME_MODULES` se importa eager; las rutas lazy solo separan las pantallas.
  Cargar cada juego bajo demanda reduciría el chunk inicial de forma notable (P2).
- Generación: ≤ 26 ms de media por challenge en Logic L10 (peor caso 232 ms); resto < 2 ms.
  Se generan todos los challenges de la sesión al montar: aceptable.
- Re-renders: `Countdown` re-renderiza cada 100 ms solo su subárbol. Sin cálculos caros en render.
- `localStorage`: una lectura por página y una escritura por sesión. Correcto.

## Accessibility

**Clasificación: Good.** HTML semántico, skip link, foco gestionado en cada challenge y resultado,
feedback con icono + texto (no solo color), `aria-live` en feedback, cuenta atrás que solo anuncia
los últimos segundos, `prefers-reduced-motion`, tablas reales para grids, ordenación sin drag & drop.

Pendiente: el `radiogroup` de niveles no implementa flechas/roving tabindex; los juegos de `locate`
no tienen atajos de teclado (en desventaja con límite de tiempo); opciones de grid de Pattern
Architect son glifos sin etiqueta para lector de pantalla; `<div>` dentro de `<pre><code>`
(`Pseudocode.tsx`); `aria-label` sobre `<span>` sin rol (no se anuncia).

## Mobile

**Clasificación: Needs improvement.** El layout es responsive y el código hace scroll horizontal,
pero: el teclado numérico de iOS no permite negativos (Q6); Bug Hunter L10 muestra 42 ítems en
`text-xs` con respuesta a un solo toque; celdas de grid con `break-all` pueden partir los glifos.

## Product Value

Ver [product-value.md](product-value.md). Resumen: hoy aporta práctica deliberada y bien calibrada
para cinco habilidades de lectura de código, con explicaciones. No aporta todavía aprendizaje de
programación, visión de progreso en el tiempo ni un plan personal.

## Retention

**Clasificación: Critical.** No existe ningún motivo explícito para volver: sin daily challenge,
sin objetivo, sin revisión, sin evolución visible, sin recomendaciones entre sesiones. La única
señal es el nivel sugerido por juego. (Positivo: no hay dark patterns que retirar.)

## Monetization Readiness

**Clasificación: Needs improvement.** La arquitectura permite separar contenido gratuito/premium por
juego, nivel o módulo sin cambios de dominio (registro de módulos, `LevelTable`), y el repositorio
por puerto permite cuentas. Falta: identidad de usuario, sincronización, concepto de plan/feature
flag, analítica de producto (qué se usa), y sobre todo el valor diferencial (LEARN + plan personal)
por el que alguien pagaría.

## Security

- Sin `dangerouslySetInnerHTML`, `eval` ni `Function`; todo el contenido se renderiza como texto.
- Datos persistidos validados con guards antes de entrar al dominio.
- `?seed=` y `:level` validados en la ruta (`parseSeed`, `parseDifficultyLevel`).
- El formato `question`/`solution` separado ya prepara la evaluación en servidor (la solución hoy
  viaja al cliente, aceptable sin backend).
- Riesgo futuro: el code playground. Regla: nunca ejecutar código del usuario en el hilo principal;
  ver §6 de la propuesta de Learning.

## Technical Debt

1. Esquema de progreso sin migraciones y persistencia todo-o-nada.
2. Orquestación de persistencia en hooks (get→apply→save duplicado).
3. Carga eager de todos los juegos.
4. Intérprete de pseudocódigo acoplado a un juego.
5. Tests sin invariantes de adivinabilidad/posición; muestras pequeñas.
6. `coverage/` generado en el árbol (ignorado por git, correcto) — sin deuda, solo higiene local.

## Critical Issues

1. **P0-1** Respuestas adivinables en Algorithmic Logic (dependency-order, L3+).
2. **P0-2** Respuestas adivinables en Code Memory (ids y enteros).
3. **P1** Exploit de skip e inflado estadístico del assessment.
4. **P1** Pérdida de progreso por dato corrupto; crash con `localStorage` bloqueado; sin error boundary.
5. **P1** Sesgos posicionales (Logic trace L1–3, Bug Hunter ítem 1) y ramas `if` idénticas.
6. **P1** Negativos en iOS; flash del prompt antes de la fase de estudio.

## Recommended Improvements

Por orden (detalle, esfuerzo y dependencias en [improvement-roadmap.md](improvement-roadmap.md)):

1. Phase 1: corregir P0 y P1 anteriores **y añadir tests de invariantes de adivinabilidad** que
   habrían detectado los P0, para que no vuelvan.
2. Persistencia versionada por slices con migraciones, antes de añadir Learning.
3. Phase 2–4: Learning Engine y 10 lecciones según la propuesta.
4. Phase 5: dashboard "Your Mind" + recomendaciones Learn ↔ Train + daily challenge.
5. Phase 6: onboarding, carga lazy de juegos, accesibilidad pendiente, design tokens.
