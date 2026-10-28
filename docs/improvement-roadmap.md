# Roadmap de mejoras (2026-10)

> Derivado de [product-audit.md](product-audit.md). Estado: ✅ hecho en esta iteración · ⏳ pendiente.
> El roadmap anterior (programación) está en [history/improvement-roadmap-2026-09.md](history/improvement-roadmap-2026-09.md).

## P0 — bloquea el funcionamiento

No se encontraron P0: lint, tipos, 548 tests y build estaban en verde.

## P1 — imprescindible para la nueva experiencia

| ID    | Mejora                                                                                                     | Estado |
| ----- | ---------------------------------------------------------------------------------------------------------- | ------ |
| P1-1  | Habilidades cognitivas generales; programación como especialización                                        | ✅     |
| P1-2  | Formatos `sequence`, `multi-select`, `pairs`, `tap` en el dominio                                          | ✅     |
| P1-3  | Metadatos de catálogo (`GameMeta`), 6 categorías, colecciones espacial/concentración                       | ✅     |
| P1-4  | Sidebar persistente/contraíble + drawer móvil; 29 destinos funcionales                                     | ✅     |
| P1-5  | Dashboard: bienvenida, continuar, reto diario, sesión rápida, recomendaciones, progreso real, áreas, rutas | ✅     |
| P1-6  | Rutas Kids/Teens/Adults/Seniors/Programmers sobre el catálogo único                                        | ✅     |
| P1-7  | Catálogo: 10 juegos × 6 categorías, 10 niveles cada uno (ver [game-catalog.md](game-catalog.md))           | ✅     |
| P1-8  | Progreso v2 con totales y migración                                                                        | ✅     |
| P1-9  | Preferencias y accesibilidad configurable (texto, movimiento, confort, sin tiempo)                         | ✅     |
| P1-10 | Assessment general (rápido/estándar) + programación; historial y perfil                                    | ✅     |
| P1-11 | Kit de juego y contrato de tests común                                                                     | ✅     |

## P2 — mejora importante

| ID    | Mejora                                                                                                                                                                                                      | Estado |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P2-1  | Desbloqueo transparente + modo libre                                                                                                                                                                        | ✅     |
| P2-2  | Resultados: comparación válida, tiempo de reacción, pesos reales, "algo para practicar"                                                                                                                     | ✅     |
| P2-3  | Feedback breve auto-avance en juegos rápidos                                                                                                                                                                | ✅     |
| P2-4  | Sistema de diseño con tokens e iconos propios                                                                                                                                                               | ✅     |
| P2-5  | Instrucciones reabribles durante la partida                                                                                                                                                                 | ✅     |
| P2-6  | Hitos basados en datos reales, sin rachas                                                                                                                                                                   | ✅     |
| P2-7  | Carga diferida: ✅ parcial — el registro de juegos y la app cargan en un chunk asíncrono (inicial 383 → 217 kB; registro 568 kB aparte). ⏳ Falta separar metadatos (eager) de generador + vista por juego. | ✅/⏳  |
| P2-8  | Niveles bloqueados también en la URL directa `/games/:id/play/:level` (pantalla explicativa con enlace al nivel abierto).                                                                                   | ✅     |
| P2-9  | Botón de pausa en presentaciones secuenciales (lectores de pantalla lentos)                                                                                                                                 | ⏳     |
| P2-10 | Tema claro / alto contraste                                                                                                                                                                                 | ⏳     |
| P2-11 | Estímulos auditivos (memoria auditiva) — no implementados                                                                                                                                                   | ⏳     |
| P2-12 | Tests visuales/responsive automatizados (Playwright) y auditoría axe                                                                                                                                        | ⏳     |

## P3 — evolución futura

Internacionalización (español primero), cuentas y backend, assessment adaptativo (IRT), recuperación
espaciada de largo plazo para juegos de memoria (hoy sólo en el curso), panel para tutores,
contenido por organización. Ver [future-saas.md](future-saas.md).
