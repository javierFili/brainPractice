# Accesibilidad

Objetivo de diseño: WCAG 2.2 AA. No se ha hecho una auditoría con usuarios ni con herramientas
automáticas externas (axe/Lighthouse); lo verificado está en tests de Testing Library (roles,
nombres accesibles, foco, teclado).

## Implementado

- **Estructura**: landmarks (`nav`, `main`, `aside`), "Skip to content", un `h1` por pantalla
  (comprobado en las 29 entradas del sidebar), tablas con `caption` y `th scope`.
- **Navegación**: sidebar con `aria-current`; estado activo con barra y peso además del color;
  contraído, las etiquetas siguen disponibles para lectores y aparecen como tooltip con foco o
  hover. En móvil, drawer `role=dialog aria-modal` con foco atrapado, Escape y devolución del foco.
- **Teclado**: todos los juegos tienen `keyboard: 'full'` salvo los que lo indican; opciones con
  teclas 1–n, flechas entre celdas, Enter/Espacio; el selector de nivel es un radiogroup con
  flechas, Home/End; los niveles bloqueados se anuncian como "locked".
- **Foco**: el enunciado recibe el foco al aparecer; el feedback mueve el foco al botón de continuar.
- **Color**: los glifos combinan forma y color y su nombre accesible incluye ambos; las celdas de
  revisión añaden ✓ ✗ •; el feedback usa texto.
- **Tiempo**: modo relajado por juego o por defecto (Ajustes → Accesibilidad "No time limits"),
  feedback breve que espera al jugador en ese modo, instrucciones reabribles ("How to play").
- **Texto y objetivos**: tamaño de texto Estándar / Grande / Extra grande; modo confort (44 px);
  zoom del navegador sin pérdida (todo en `rem`, sin scroll horizontal a 360 px en las cuadrículas
  del kit).
- **Movimiento**: `prefers-reduced-motion` y opción propia; ninguna animación es necesaria para
  entender la tarea; nada parpadea más de 3 veces por segundo.
- **Lectores de pantalla**: presentaciones secuenciales anunciadas con `aria-live`; señales de
  reacción anunciadas con `aria-live="assertive"`.

## Limitaciones conocidas

| Juego / área                                                                          | Limitación                                                                                                                |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Reaction Test y juegos de velocidad                                                   | Requieren respuesta rápida; el modo relajado quita límites en los de velocidad, pero no alarga la señal de Reaction Test. |
| Color and Shape Decisions, Visual Search (niveles de conjunción), algunos de Atención | Requieren distinguir colores; el nombre accesible permite resolverlos con lector de pantalla.                             |
| Presentaciones secuenciales (Sequence Recall, Word Recall, Working Memory Grid…)      | Un lector lento puede ir por detrás de `aria-live`; no hay botón de pausa (el modo relajado ralentiza ×1,5).              |
| Cuadrículas 6×6 / 6×8                                                                 | Celdas de ~40 px a 360 px de ancho: el mínimo admitido.                                                                   |
| Tema                                                                                  | Sólo tema oscuro; no hay tema claro ni alto contraste reforzado.                                                          |

Cada juego documenta sus límites en `meta.accessibilityNotes` (visible en su página) y en
`docs/games/<categoría>.md`.
