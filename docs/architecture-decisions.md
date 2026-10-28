# Decisiones de arquitectura (ADR)

Formato breve: contexto → decisión → consecuencias. Las decisiones anteriores (D1–D…) siguen en
[../ARCHITECTURE.md](../ARCHITECTURE.md).

## ADR-01 · Reutilizar el motor existente en lugar de reescribirlo

**Contexto.** El motor (sesión pura, generación por seed, validación, scoring) ya cumplía casi todos
los principios pedidos: dominio sin React, reloj y aleatoriedad inyectados, tests sin navegador.
**Decisión.** Extenderlo, no sustituirlo. Los cinco juegos existentes se movieron a
`src/games/programming/` sin cambiar su id (el progreso guardado sigue siendo válido).
**Consecuencias.** Cero regresiones en los 548 tests previos; toda la plataforma nueva hereda las
garantías del motor.

## ADR-02 · Formatos de respuesta nuevos en el dominio, no lógica de juego en la UI

**Contexto.** Parejas, reacción, posiciones y secuencias no encajaban en los 4 formatos.
**Decisión.** Añadir `sequence`, `multi-select` (errores = omisiones + marcas incorrectas ≤
`maxErrors`), `pairs` (lista de intentos; correcto si se encuentran todas las parejas con ≤
`maxMisses` fallos) y `tap` (go/no-go; `reactionMs` desde el inicio de la señal, negativo = salida
en falso). La vista sólo **registra** lo que hizo el jugador; el dominio decide.
**Consecuencias.** Un único `evaluateAnswer` para 8 formatos; respuestas malformadas son errores,
nunca "incorrectas"; `solutionAnswer` permite comprobar en tests que cada challenge es resoluble.

## ADR-03 · Categoría ≠ área de assessment

**Decisión.** `meta.category` organiza el catálogo (memory, logic, speed, attention, patterns,
programming); `area` (5 áreas) sigue siendo la dimensión del assessment. Un juego de programación
puede reportar a `logic`. "Razonamiento espacial" y "Concentración" son **colecciones** por
habilidad que cruzan categorías.

## ADR-04 · Los públicos son configuración, no aplicaciones

**Decisión.** `PathDefinition` (`src/content/paths.ts`): textos, juegos destacados, categorías de
foco y ajustes sugeridos. Elegir una ruta nunca limita juegos ni niveles; la edad nunca se usa
como medida de capacidad. Los ajustes sugeridos (p. ej. texto grande para mayores) se aplican de
forma visible y se pueden cambiar.

## ADR-05 · Preferencias como slice persistido propio

**Decisión.** `Preferences` (v1) en su propia clave de localStorage, con recuperación campo a
campo. Se aplican al `<html>` (`data-text-size`, `data-motion`, `data-comfort`) y el CSS las lee:
todo está en `rem`, así que el texto grande escala la interfaz entera.

## ADR-06 · Totales de práctica en el progreso (esquema v2)

**Contexto.** Con sólo las últimas 50 sesiones, "minutos totales" habría sido inventado.
**Decisión.** `totals { sessions, practiceMs }` acumulados; la migración v1→v2 los inicializa con
las sesiones conservadas (cota inferior documentada). Sesiones sin ninguna respuesta no cuentan.

## ADR-07 · Desbloqueo transparente que nunca bloquea

**Decisión.** Nivel 1 siempre abierto; nivel n+1 abierto con rendimiento ≥ 50 en n **o** tras 3
sesiones completas de n. Modo libre abre todo. La regla se muestra en la página del juego.

## ADR-08 · Recomendaciones deterministas y explicadas, sin IA

**Decisión.** `recommendTraining`, `continueTarget`, `planQuickSession`, `milestones` y
`compareWith` son funciones puras con tests. Cada recomendación incluye su motivo en términos de la
actividad de la persona ("no has practicado atención en dos semanas"), nunca un diagnóstico.

## ADR-09 · Comparaciones sólo entre ejercicios equivalentes

**Decisión.** Una sesión sólo se compara con la anterior completada del mismo juego, nivel y modo de
tiempo. Un assessment sólo con el anterior del mismo protocolo. Los hitos se calculan siempre
desde los datos guardados (no se almacenan aparte) y ninguno depende de rachas.

## ADR-10 · Catálogo construido en paralelo con un contrato común

**Decisión.** `describeGameContract` (registro, reproducibilidad, solución aceptada, variedad, sin
sesgo de posición, la vista renderiza en todas las fases) + `docs/game-authoring.md`. Cada categoría
se implementó por separado contra ese contrato.
**Consecuencias.** Un juego sólo cuenta como implementado si pasa el contrato y tests propios de
corrección; el catálogo lo refleja [game-catalog.md](game-catalog.md).

## ADR-11 · Sin dependencias nuevas

Iconos SVG propios, gráficos (sparklines, barras) en SVG/CSS, sin librería de componentes ni de
estado. El `package.json` no cambió.
