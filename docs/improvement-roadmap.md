# Improvement Roadmap

> Derivado de [product-audit.md](product-audit.md). Esfuerzo: **S** < ½ día · **M** 1–2 días ·
> **L** 3–5 días · **XL** > 1 semana. Estado: ✅ hecho en Phase 1 · ⏳ pendiente.

## P0 — Critical

### P0-1 · Algorithmic Logic: dependency-order adivinable ✅

- **Problem:** desde L3, los distractores son swaps adyacentes del orden válido; la opción más
  cercana a todas las demás es la correcta el 80–87 % de las veces (azar: 25 %).
- **Why it matters:** el jugador puntúa sin razonar sobre dependencias; precisión, subida de nivel y
  assessment de Logic dejan de medir la habilidad.
- **Impact:** alto · **Effort:** M
- **Proposed solution:** cada distractor se construye de forma independiente desde un orden
  topológico **distinto** (no desde la respuesta) al que se le inyecta exactamente una violación;
  test de invariante "la heurística de centralidad no supera un umbral cercano al azar".
- **Dependencies:** ninguna.

### P0-2 · Code Memory: opciones de id/entero adivinables ✅

- **Problem:** `nearValues(correct)` genera los distractores alrededor de la respuesta; la opción
  "hub" es la correcta en el 70–95 % de las preguntas de id.
- **Why it matters:** la precisión de Memory en elección múltiple no mide memoria.
- **Impact:** alto · **Effort:** M
- **Proposed solution:** los distractores salen de un **conjunto de señuelos** en el que la
  respuesta es un miembro más: se eligen primero valores vecinos entre sí (p. ej. otros valores
  mostrados en el material y variaciones de _un señuelo_), de forma que la estructura de cercanías
  sea simétrica; test de invariante de adivinabilidad por centralidad.
- **Dependencies:** ninguna.

## P1 — High

### P1-1 · Assessment: saltar infla la puntuación ✅

- **Problem:** los challenges skipped y las rondas sin intentos se excluyen del cálculo; saltar un
  L8 difícil **sube** la nota. El botón de salto es de un solo clic.
- **Why it matters:** un número que se puede inflar no es un número honesto.
- **Impact:** alto · **Effort:** S
- **Proposed solution:** en el assessment, los skipped cuentan como intentados e incorrectos; el
  botón pasa a "Skip round" con aviso de que cuenta como no resuelto; un assessment sin ninguna
  respuesta no se guarda.
- **Dependencies:** ninguna.

### P1-2 · Persistencia: pérdida total por dato corrupto, crash con storage bloqueado ✅

- **Problem:** guard todo-o-nada + sobrescritura posterior; `getItem`/`window.localStorage` pueden
  lanzar y no se capturan.
- **Why it matters:** perder el progreso es la forma más rápida de perder a un usuario.
- **Impact:** alto · **Effort:** M
- **Proposed solution:** (a) recuperación parcial: se conservan las entradas válidas y se descartan
  solo las inválidas; (b) copia de seguridad del valor ilegible bajo una clave `…:corrupt-<ts>`
  antes de sobrescribir; (c) acceso a storage protegido, con fallback a memoria y aviso en UI.
- **Dependencies:** ninguna. Prepara P2-8 (migraciones).

### P1-3 · Sin error boundary ✅

- **Problem:** cualquier excepción muestra la pantalla por defecto de React Router.
- **Impact:** medio · **Effort:** S
- **Proposed solution:** `errorElement` en la ruta raíz con mensaje humano, acción de recarga y
  detalles técnicos plegados.

### P1-4 · Sesgos que permiten adivinar sin resolver ✅

- **Problem:** Logic trace L1–3 (respuesta casi nunca mínima/máxima); Bug Hunter (el bug nunca es el
  ítem 1 en tipos de registros).
- **Impact:** medio · **Effort:** S
- **Proposed solution:** distractores de relleno simétricos alrededor de la respuesta (por debajo y
  por encima con igual probabilidad, rango desplazado aleatoriamente); rango de posición del bug
  sobre todos los ítems. Tests de distribución.
- **Resultado:** Logic trace corregido (posición de la respuesta sorteada primero). Bug Hunter corregido
  para los tipos de registros; en `code-rule` queda un sesgo posicional semántico en L2–3 (ver P2-17).

### P1-5 · Logic: `if` con ramas idénticas (28 % en L2) ✅

- **Problem:** la condición no influye en el resultado justo en el nivel de "branching".
- **Impact:** medio · **Effort:** S
- **Proposed solution:** rechazar candidatos cuyo resultado no cambia al invertir cada `if`
  (usando la mutación `flipIf` ya existente del intérprete). Test de invariante.

### P1-6 · Móvil: no se pueden escribir negativos en iOS ✅

- **Problem:** `inputMode="numeric"` no tiene tecla "−".
- **Impact:** medio (≈25 % de respuestas numéricas de Memory) · **Effort:** S
- **Proposed solution:** `inputMode="text"` + `pattern` numérico cuando la respuesta admite signo, o
  botón "±" junto al campo. Se aplica el botón ± (funciona en todos los teclados).

### P1-7 · Memory: el prompt se ve antes de la fase de estudio ✅

- **Problem:** `presenting` se renderiza como `respond` durante una frame.
- **Impact:** medio · **Effort:** S
- **Proposed solution:** `presenting` de un challenge con `studyMs` se renderiza como `study`.
  Test de integración del flujo estudio → respuesta.

### P1-8 · Assessment: precisión estadística sobrevendida ✅ (parcial)

- **Problem:** 6 ítems por área (±15 puntos) presentados con bandas de 20 puntos
  ("Exceptional"); "relative to difficulty" es inexacto; sin corrección por azar.
- **Impact:** medio (honestidad del producto) · **Effort:** S (copy) / M (modelo)
- **Proposed solution:** Phase 1: mostrar número de ítems y margen aproximado por área, corregir el
  copy. Futuro (P3-4): modelo IRT/ELO y más ítems adaptativos.

### P1-9 · Tests de invariantes de medición ✅

- **Problem:** ningún test detecta respuestas adivinables o sesgos posicionales.
- **Impact:** alto (evita regresiones de P0) · **Effort:** S
- **Proposed solution:** helper de test reutilizable `guessability` (centralidad, extremos, posición)
  aplicado a los juegos de elección múltiple.

### P1-10 · No existe el pilar LEARN ⏳ (Phase 2–4)

- **Problem / Why:** es el diferenciador del producto y la principal razón para volver y pagar.
- **Impact:** muy alto · **Effort:** XL
- **Proposed solution:** [learning-engine-proposal.md](learning-engine-proposal.md).
- **Dependencies:** P2-8 (persistencia por slices), P2-9 (intérprete compartido).

### P1-11 · No hay motivo para volver ⏳ (Phase 5)

- **Problem:** sin daily challenge, objetivo, revisión ni evolución visible.
- **Impact:** muy alto · **Effort:** L
- **Proposed solution:** dashboard "Your Mind" con perfil y evolución, daily challenge determinista
  por fecha (seed = día), objetivo semanal elegido por el usuario, recomendaciones explicadas.
- **Dependencies:** P1-10 para la parte de revisión.

## P2 — Medium

| ID    | Problem                                                                          | Why it matters                         | Impact | Effort | Proposed solution                                                                                      | Deps |
| ----- | -------------------------------------------------------------------------------- | -------------------------------------- | ------ | ------ | ------------------------------------------------------------------------------------------------------ | ---- |
| P2-1  | Todos los juegos en el chunk inicial (371 kB)                                    | primera carga en móvil                 | medio  | M      | registro de metadatos eager + `definition`/`ContentView` lazy por juego                                | —    |
| P2-2  | Logic: feedback sin traza paso a paso; review visual vacía                       | se aprende del error, no del resultado | medio  | M      | traza por línea desde el intérprete; `ContentView` usa `phase`                                         | —    |
| P2-3  | Mezcla de tipos irregular en Logic L8–L10; mesetas en Code Scan y Pattern L9≈L10 | progresión percibida                   | medio  | M      | revisar tablas de niveles con test de monotonía                                                        | —    |
| P2-4  | Code Scan: adivinar rápido tiene esperanza positiva en L1                        | incentiva no leer                      | medio  | S      | `maxSpeedBonus` solo si la sesión supera un umbral de precisión o penalización de incorrectas escalada | —    |
| P2-5  | Relaxed timing no relaja el estudio ✅                                           | accesibilidad                          | medio  | S      | `studyMs × 2` en assisted ✅ (`ASSISTED_STUDY_FACTOR`)                                                 | —    |
| P2-6  | Locate sin atajos de teclado; radiogroup sin flechas                             | accesibilidad con límite de tiempo     | medio  | S      | flechas + Enter en locate; roving tabindex                                                             | —    |
| P2-7  | Un clic responde en Bug Hunter/locate                                            | toques accidentales en móvil           | medio  | S      | seleccionar + confirmar en pantallas táctiles                                                          | —    |
| P2-8  | Esquema de progreso sin migraciones, blob único                                  | Learning añade datos                   | alto   | M      | slices versionados (`games`, `learning`, `assessments`) con migradores puros y tests                   | P1-2 |
| P2-9  | Intérprete acoplado a Logic y solo numérico                                      | Learning lo necesita                   | medio  | M      | mover a `domain/pseudocode`, añadir string/boolean                                                     | —    |
| P2-10 | get→apply→save duplicado en hooks                                                | casos de uso en UI                     | bajo   | S      | `recordSessionResult(repo, result)` en `engine/`                                                       | —    |
| P2-11 | Assessment todo-skipped guardado; Retake oculto en empates                       | UX                                     | bajo   | S      | no guardar sin respuestas ✅; mostrar acciones siempre ✅                                              | —    |
| P2-12 | Opciones de grid (Pattern) sin etiqueta accesible                                | lector de pantalla                     | medio  | S      | `aria-label` con descripción del patrón                                                                | —    |
| P2-13 | Hover del catálogo no funciona (clase dinámica)                                  | pulido visual                          | bajo   | S      | clase `hover` literal en `AreaMeta` ✅                                                                 | —    |
| P2-14 | Titular "Outstanding" en sesiones terminadas antes                               | honestidad                             | bajo   | S      | titular neutro si `!completed` ✅                                                                      | —    |
| P2-15 | Design tokens implícitos (clases slate/sky repetidas)                            | consistencia Games/Learn               | medio  | M      | tokens de tema en `@theme` de Tailwind + primitivas (Card, CodeBlock, FeedbackPanel)                   | —    |
| P2-17 | Bug Hunter `code-rule`: el bug cae sobre todo al final del listado en L2–3       | eliminar zonas "seguras"               | bajo   | M      | inyectar reglas que admitan cualquier posición (leer antes de definir con la definición al principio)  | —    |
| P2-16 | "Reset progress" deshabilitado con solo assessments                              | UX                                     | bajo   | S      | habilitar si hay cualquier dato ✅                                                                     | —    |

## P3 — Future

| ID   | Problem                                                  | Proposed solution                                                                                          | Effort |
| ---- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------ |
| P3-1 | Ordenar 10 ítems con ↑/↓ es tedioso                      | drag & drop accesible (con teclado) o "tap to place"                                                       | M      |
| P3-2 | Multi-pestaña: última escritura gana                     | evento `storage` + merge; resuelto de verdad con API                                                       | M      |
| P3-3 | Pattern: "The hidden program" con programas artificiosos | "One program that fits" + preferir el más natural                                                          | S      |
| P3-4 | Assessment sin modelo estadístico                        | IRT/ELO adaptativo, más ítems, intervalos                                                                  | L      |
| P3-5 | HTML inválido (`div` en `pre`), `aria-label` en `span`   | markup semántico                                                                                           | S      |
| P3-6 | Test con presupuesto de tiempo frágil en CI ✅           | presupuesto 20 → 50 ms por challenge (detecta regresiones de orden de magnitud, no ruido de planificación) | S      |
| P3-7 | Cuentas, sincronización, planes                          | `ApiProgressRepository`, feature flags por plan                                                            | XL     |
| P3-8 | Code playground con ejecución real                       | worker + iframe `sandbox` o ejecución en servidor                                                          | XL     |
| P3-9 | Reanudar un assessment interrumpido                      | persistir estado del flujo                                                                                 | M      |

## Resultado de Phase 1 (2026-09-30)

- Hechos: P0-1, P0-2, P1-1 … P1-9, P2-5, P2-11, P2-13, P2-14, P2-16, P3-6.
- Verificación: `npm run lint`, `npm run typecheck`, `npm test` (44 archivos, 424 tests) y
  `npm run build` en verde.
- Medido con los nuevos tests de invariantes: la heurística de centroide en dependency-order baja
  del 73–95 % a ≤ azar + 15 puntos; en Code Memory, del 40–65 % a ≤ azar + 15 puntos en todos los
  niveles.
- Pendientes de Phase 1 que pasan a Phase 6: P2-1 (lazy load de juegos), P2-6, P2-7, P2-12.

## Orden de ejecución

```text
Phase 1  P0-1 P0-2 P1-1..P1-9 + P2 triviales (✅ en este commit)
Phase 2  P2-8 → P2-9 → Learning domain + engine (P1-10)
Phase 3  Curriculum Programming Logic (10 lecciones)
Phase 4  Experiencia interactiva (playgrounds, feedback, mastery, unlocks)
Phase 5  P1-11 dashboard + recomendaciones + daily challenge
Phase 6  P2-1 P2-2 P2-3 P2-6 P2-7 P2-15, onboarding, pulido
```
