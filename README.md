# BrainPractice — práctica mental para todas las edades

Plataforma de entrenamiento cognitivo recreativo: **60 juegos** en 6 categorías (memoria, lógica,
velocidad mental, atención y concentración, patrones y razonamiento espacial, programación), cada
uno con **10 niveles**; rutas para niños, jóvenes, adultos, personas mayores y programadores;
reto diario, sesiones rápidas de 3–15 minutos, evaluación cognitiva recreativa, progreso real y un
curso opcional de lógica de programación. Demo sin backend: todo se guarda en el navegador.

> Práctica y autoevaluación recreativa. Los resultados describen el desempeño en estas actividades.
> **No** es un test de IQ, no diagnostica, no trata ni previene ninguna condición.

## Inicio rápido

```bash
npm install
npm run dev          # http://localhost:5173
```

Requiere Node ≥ 20.19.

| Script              | Propósito                                               |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo                                  |
| `npm run build`     | Comprobación de tipos + build de producción             |
| `npm test`          | Vitest (todos los tests)                                |
| `npm run coverage`  | Tests con cobertura (umbrales en `domain/` y `engine/`) |
| `npm run lint`      | ESLint estricto con reglas de capas                     |
| `npm run typecheck` | TypeScript estricto                                     |
| `npm run format`    | Prettier                                                |

## Qué incluye

- **Sidebar** persistente y contraíble (escritorio) / menú modal (móvil): General, Entrenamiento,
  Rutas, Evaluación, Aprendizaje, Configuración. Todas las entradas llevan a pantallas funcionales.
- **Inicio**: continuar, reto diario, sesión rápida, recomendaciones explicadas, progreso real,
  áreas, rutas y la especialización de programación.
- **Catálogo** con búsqueda y filtros (área, público, sin límite de tiempo) y páginas por área,
  incluidas las colecciones transversales "Spatial reasoning" y "Concentration".
- **Página de cada juego**: qué se hace, cómo se juega, nivel, cómo se calcula el resultado, si hay
  límite de tiempo, accesibilidad y guardado local. Niveles que se desbloquean de forma
  transparente (o modo libre).
- **Partida**: feedback inmediato, instrucciones reabribles, modo relajado sin límites, teclado.
- **Resultados**: aciertos, precisión, tiempos (reacción por separado), récord, comparación con la
  última sesión comparable, algo para practicar y recomendación de nivel.
- **Rutas** Kids / Teens / Adults / Seniors / Programmers: configuración sobre el mismo catálogo.
- **Evaluación cognitiva**: protocolos rápido, estándar y programación; historial y perfil.
- **Mi progreso**: totales, distribución, récords y tendencias por nivel, hitos, historial.
- **Ajustes**: ruta, meta diaria, modo relajado por defecto, modo libre; accesibilidad (texto,
  movimiento, confort); datos (ver en JSON, restablecer con confirmación).
- **Learn**: curso de 10 lecciones de lógica de programación y página de pensamiento computacional.

Estado detallado de cada juego: [docs/game-catalog.md](docs/game-catalog.md).

## Arquitectura

```text
src/
├── domain/          reglas puras (sin React/DOM): challenge, game, session, scoring, difficulty,
│                    progress, preferences, paths, insights, assessment, learning, pseudocode
├── engine/          GameEngine, GameSession, AssessmentEngine, LessonSession
├── games/
│   ├── kit/         contenido puro compartido (glifos, objetos, palabras, niveles) + UI (grids, cartas, reacción)
│   ├── <categoría>/<juego>/{content,ui,index.ts,*.test.tsx}
│   ├── registry.ts  única enumeración de juegos
│   └── assessment.ts protocolos de evaluación
├── content/         rutas (paths.ts) y curso de programación
├── infrastructure/  reloj, semillas, repositorios localStorage versionados
├── components/      UI: ui/, layout/, navigation/, response/, code/
├── features/        pantallas
├── app/             composición, providers (servicios, preferencias), rutas
└── test/            fakes, fixtures, contrato de juego, helpers
```

Flujo: `GameDefinition` (datos + generador puro) → `generateChallenge` (semilla, validación) →
`GameSession` (máquina de estados pura, el tiempo llega en eventos) → `evaluateAnswer` →
`ScoringStrategy` → `PerformanceMetrics` → `GameResult` → `applySessionResult` →
`ProgressRepository`. Decisiones en [docs/architecture-decisions.md](docs/architecture-decisions.md)
y [ARCHITECTURE.md](ARCHITECTURE.md).

## Cómo…

- **Añadir un juego**: sigue [docs/game-authoring.md](docs/game-authoring.md): carpeta
  `src/games/<categoría>/<slug>/` con `content/` (tipos, `defineLevels`, definición con `meta`) y
  `ui/` (vista), módulo en `index.ts`, registro en `src/games/<categoría>/index.ts`, y
  `describeGameContract(module)` + tests de corrección.
- **Añadir o cambiar un nivel**: edita la fila en `content/levels.ts` del juego (siempre 10 filas;
  `defineLevels` lo exige) y ajusta los tests de progresión.
- **Añadir una categoría**: agrega el id a `GAME_CATEGORIES` (`src/domain/game/catalog.ts`), sus
  textos/colores en `src/features/shared/categories.ts`, su colección en
  `src/features/catalog/collections.ts`, la entrada del sidebar en
  `src/components/navigation/navigation.ts` y su array en `src/games/registry.ts`.
- **Modificar un perfil/ruta**: edita `src/content/paths.ts` (textos, juegos destacados, foco) y
  los ajustes sugeridos en `routeDefaults` (`src/domain/preferences/preferences.ts`). Un test
  comprueba que todos los juegos citados existen.
- **Restablecer el progreso local**: Ajustes → _Reset demo data_ (`/settings/data`), con
  confirmación. También: borrar las claves `brain-practice:*` del localStorage.

## Documentación

| Documento                                                                          | Contenido                            |
| ---------------------------------------------------------------------------------- | ------------------------------------ |
| [docs/product-audit.md](docs/product-audit.md)                                     | Auditoría y hallazgos                |
| [docs/improvement-roadmap.md](docs/improvement-roadmap.md)                         | P0–P3 y estado                       |
| [docs/architecture-decisions.md](docs/architecture-decisions.md)                   | ADRs                                 |
| [docs/product-vision.md](docs/product-vision.md)                                   | Visión, públicos, retención honesta  |
| [docs/design-system.md](docs/design-system.md)                                     | Tokens y componentes                 |
| [docs/game-catalog.md](docs/game-catalog.md)                                       | Los 60 juegos y su estado            |
| [docs/game-design.md](docs/game-design.md), [docs/games/](docs/games/)             | Diseño general y por categoría       |
| [docs/game-authoring.md](docs/game-authoring.md)                                   | Cómo crear un juego                  |
| [docs/difficulty-system.md](docs/difficulty-system.md)                             | Niveles, desbloqueo, modo relajado   |
| [docs/scoring-system.md](docs/scoring-system.md)                                   | Fórmulas y métricas                  |
| [docs/accessibility.md](docs/accessibility.md)                                     | Accesibilidad y limitaciones         |
| [docs/testing.md](docs/testing.md), [TESTING.md](TESTING.md)                       | Estrategia de tests                  |
| [docs/privacy.md](docs/privacy.md)                                                 | Datos, menores, personas vulnerables |
| [docs/future-saas.md](docs/future-saas.md)                                         | Evolución a producto                 |
| [LEARNING_DESIGN.md](LEARNING_DESIGN.md), [LEARNING_ENGINE.md](LEARNING_ENGINE.md) | Curso de programación                |

## Terminado, experimental, pendiente

- **Terminado**: todo lo listado en "Qué incluye" (ver tests).
- **Experimental**: los protocolos de evaluación (pocos ítems, margen amplio, sin normas).
- **Pendiente**: carga diferida por juego, tema claro, estímulos auditivos, pausa en
  presentaciones, i18n, backend. Ver [roadmap](docs/improvement-roadmap.md).
