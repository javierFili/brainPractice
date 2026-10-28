# Auditoría de producto y código — plataforma general (Fase 0, 2026-10)

> Commit auditado: `9bb14fd` (main, árbol limpio). La auditoría anterior (2026-09, centrada en
> programación) está en [history/product-audit-2026-09.md](history/product-audit-2026-09.md).
> Prioridades y estado en [improvement-roadmap.md](improvement-roadmap.md); decisiones en
> [architecture-decisions.md](architecture-decisions.md).

## 1. Qué había realmente (verificado)

Validación ejecutada antes de tocar nada:

| Comando             | Resultado                                          |
| ------------------- | -------------------------------------------------- |
| `npm run lint`      | OK, 0 avisos                                       |
| `npm run typecheck` | OK                                                 |
| `npm test`          | 57 archivos, **548 tests en verde**                |
| `npm run build`     | OK; chunk inicial `index` **383 kB** (120 kB gzip) |

Stack: React 19, React Router 7 (rutas lazy), TypeScript 5.9 estricto (`exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`), Tailwind 4, Vite 8, Vitest 4 + Testing Library, ESLint con reglas de
capas (el dominio no puede importar React, `Math.random` ni `Date.now`).

Arquitectura existente, sólida y reutilizable:

- **Dominio puro** (`src/domain`): `GameDefinition` + `LevelTable` (10 niveles tipados), generación
  determinista por seed (`mulberry32`, `deriveSeed`), `validateChallenge`, formatos de respuesta
  compartidos (`single-choice`, `ordering`, `locate`, `numeric`) evaluados en un único lugar,
  máquina de estados de sesión pura (`sessionReducer`, el tiempo entra en los eventos), scoring
  estándar documentado, dificultad adaptativa por reglas, assessment, progreso versionado con
  recuperación parcial de datos dañados.
- **Engine** (`GameEngine`, `GameSession`, `AssessmentEngine`), ejecutable sin navegador.
- **Learn**: curso de 10 lecciones con intérprete de pseudocódigo propio y seguro.
- **5 juegos**, todos de programación (Algorithmic Logic, Code Memory, Code Scan, Bug Hunter,
  Pattern Architect).

## 2. Hallazgos

| ID   | Hallazgo                                                                                                                                                                                  | Prioridad |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| A-1  | El producto entero está orientado a programadores: copy ("think like a programmer"), habilidades (`ProgrammingSkill`), los 5 juegos, onboarding. Inútil para un niño o una persona mayor. | P1        |
| A-2  | Sólo 4 formatos de respuesta: imposible implementar parejas de cartas, reacción (go/no-go), recordar posiciones o reproducir secuencias sin meter evaluación en la UI.                    | P1        |
| A-3  | No existe noción de **categoría** ni de **público**: el catálogo es una lista de 5 juegos, uno por área.                                                                                  | P1        |
| A-4  | Navegación: 4 enlaces en una barra superior; no hay sidebar, rutas por público, configuración ni accesibilidad configurable.                                                              | P1        |
| A-5  | Todos los niveles abiertos siempre; sin reglas de desbloqueo ni modo libre explícito.                                                                                                     | P2        |
| A-6  | Progreso: sólo se guardan las últimas 50 sesiones; "tiempo de práctica" o "sesiones totales" no se podían calcular sin inventar datos.                                                    | P1        |
| A-7  | Resultados sin comparación con la sesión comparable anterior; tiempo mostrado incluso en juegos sin límite; texto "75 % accuracy · 25 % speed" fijo aunque el juego use otra fórmula.     | P2        |
| A-8  | Assessment único "Programming Cognitive Index" con juegos de código; el nombre sugiere un índice cognitivo general.                                                                       | P1        |
| A-9  | Sin preferencias: no hay texto grande, reducción de movimiento propia de la app, modo sin tiempo por defecto ni controles amplios.                                                        | P1        |
| A-10 | Feedback siempre con explicación y botón: en juegos rápidos rompe el ritmo.                                                                                                               | P2        |
| A-11 | Diseño: paleta slate/sky con estética de editor de código (`{ }`, fuente mono); tokens implícitos repetidos en cada componente.                                                           | P2        |
| A-12 | Chunk inicial de 383 kB con todos los juegos; con 60 juegos crecerá.                                                                                                                      | P2        |
| A-13 | Sin instrucciones accesibles durante la partida (sólo en la página previa).                                                                                                               | P2        |
| A-14 | No se encontraron errores de lint/tipos/tests ni botones sin acción en el código existente.                                                                                               | —         |

No se encontraron bugs P0 (que bloqueen el funcionamiento): la base estaba verde.

## 3. Qué se hizo con cada hallazgo

| ID   | Resolución                                                                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-1  | Habilidades generales (`Skill` = cognitivas + programación), copy general, programación como especialización (categoría propia, ruta, curso).                                         |
| A-2  | Nuevos formatos `sequence`, `multi-select` (con tolerancia de errores), `pairs`, `tap` (go/no-go con tiempo de reacción), con validación, evaluación pura y tests.                    |
| A-3  | `GameMeta` (categoría, públicos, interacción, teclado, modo relajado, métricas, fórmula explicada); 6 categorías; colecciones transversales (espacial, concentración).                |
| A-4  | Sidebar persistente y contraíble (recuerda su estado), drawer modal en móvil, 29 destinos funcionales comprobados por test.                                                           |
| A-5  | Desbloqueo transparente: nivel 1 abierto; el siguiente con rendimiento ≥ 50 **o** 3 sesiones completas (nadie queda bloqueado); modo libre en Ajustes.                                |
| A-6  | Esquema de progreso v2 con `totals` (sesiones, ms de práctica) y migración desde v1 que parte de las sesiones conservadas (cota inferior, nunca inventada); historial ampliado a 200. |
| A-7  | Comparación sólo con la sesión anterior del mismo juego, nivel y modo; tiempo de reacción separado; pesos reales de la fórmula; "algo para practicar".                                |
| A-8  | Tres protocolos (rápido, estándar, programación), cada uno fijo y comparable sólo consigo mismo; "Performance index" interno, sin IQ ni percentiles.                                  |
| A-9  | Preferencias versionadas (ruta, tamaño de texto, movimiento, confort, sin tiempo por defecto, modo libre, meta diaria) aplicadas al `<html>`.                                         |
| A-10 | `feedback: 'brief'`: marca breve que avanza sola (espera al jugador en modo relajado).                                                                                                |
| A-11 | Sistema de diseño con tokens CSS (`@theme`), iconos propios, componentes reescritos. Ver [design-system.md](design-system.md).                                                        |
| A-12 | Pendiente (P2): ver roadmap. Las pantallas siguen siendo lazy.                                                                                                                        |
| A-13 | Botón "How to play" en cada partida.                                                                                                                                                  |
