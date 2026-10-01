# BrainPractice — Cognitive Programming Training

Entrena el pensamiento que hay detrás del código. Cinco áreas cognitivas, un juego por área, diez
niveles diseñados por juego y un **Programming Cognitive Assessment** combinado que construye un perfil
de rendimiento.

| Área      | Juego             | Entrena                                                                              |
| --------- | ----------------- | ------------------------------------------------------------------------------------ |
| Logic     | Algorithmic Logic | dependencias, orden de ejecución, traza de pseudocódigo, deducción con restricciones |
| Memory    | Code Memory       | memoria de trabajo, secuencial, posicional y contextual                              |
| Speed     | Code Scan         | comparación rápida y precisa de código y detección de cambios                        |
| Attention | Bug Hunter        | atención selectiva y sostenida, detección de anomalías                               |
| Patterns  | Pattern Architect | reconocimiento de patrones, abstracción, analogía estructural                        |

> Entrenamiento recreativo y autoevaluación. Las puntuaciones describen únicamente el rendimiento en
> estos ejercicios. Esto **no** es un test de IQ ni una evaluación psicométrica o clínica.

## Inicio rápido

```bash
npm install
npm run dev          # http://localhost:5173
```

Requiere Node ≥ 20.19.

| Script                            | Propósito                                                     |
| --------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                     | Servidor de desarrollo                                        |
| `npm run build`                   | Comprobación de tipos y build de producción                   |
| `npm test` / `npm run test:watch` | Vitest (una vez / modo watch)                                 |
| `npm run coverage`                | Tests con cobertura y umbrales                                |
| `npm run lint`                    | ESLint (estricto, con información de tipos y reglas de capas) |
| `npm run typecheck`               | TypeScript, estricto                                          |
| `npm run format`                  | Prettier                                                      |

## Funcionalidades

- Elige un juego y cualquier nivel del 1 al 10 (todos abiertos; se marcan los niveles superados y un
  nivel sugerido).
- Sesiones cronometradas con feedback inmediato y una explicación para cada respuesta.
- Resultados: índice de rendimiento, puntuación, precisión, tiempo de respuesta mediano/medio/mejor,
  racha, desglose por tipo de challenge, revisión de errores y recomendación de siguiente nivel.
- Repetir, pasar al siguiente nivel o **volver a jugar exactamente los mismos challenges por seed**
  ("Replay this seed", `?seed=…`).
- Modo "Relaxed timing" (sin límite de respuesta y el doble de tiempo de estudio; los resultados no cuentan
  para los récords).
- Progreso local por nivel y sesiones recientes (localStorage, con recuperación de datos dañados y aviso si
  el navegador bloquea el almacenamiento).
- Juego con teclado (teclas numéricas para las opciones, Enter para continuar), gestión del foco,
  movimiento reducido.

## Documentación

| Documento                                                            | Contenido                                                                              |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                                   | Capas, modelo de dominio, decisiones                                                   |
| [GAME_ENGINE.md](GAME_ENGINE.md)                                     | Ciclo de vida de la sesión, scoring, dificultad, reproducibilidad, puntos de extensión |
| [GAME_DESIGN.md](GAME_DESIGN.md)                                     | Diseño de juegos y niveles de los cinco juegos y del assessment                        |
| [TESTING.md](TESTING.md)                                             | Estrategia de testing, helpers, cobertura                                              |
| [docs/product-audit.md](docs/product-audit.md)                       | Auditoría de producto y código (Phase 0)                                               |
| [docs/improvement-roadmap.md](docs/improvement-roadmap.md)           | Prioridades P0–P3 y fases                                                              |
| [docs/product-value.md](docs/product-value.md)                       | Test "I would pay for this"                                                            |
| [docs/learning-engine-proposal.md](docs/learning-engine-proposal.md) | Propuesta del Learning Engine                                                          |
| [CONTRIBUTING.md](CONTRIBUTING.md)                                   | Cómo añadir un juego, un nivel, un tipo de challenge o una estrategia                  |

## Estructura del proyecto

```text
src/
├── domain/          pure model and rules (no React, no DOM)
├── engine/          GameEngine, GameSession, AssessmentEngine
├── games/<id>/      content/ (pure: levels, generators, solvers) + ui/ (React renderer)
├── infrastructure/  clock, seed source, localStorage repository
├── components/      UI primitives, layout, feedback, response inputs
├── features/        screens: home, catalog, game intro, play, results, profile, assessment
├── app/             composition root, providers, routes
└── test/            fakes, fixtures, render helpers
```
