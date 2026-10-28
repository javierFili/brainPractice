# Sistema de diseño

Tokens definidos en `src/index.css` dentro de `@theme` (Tailwind 4 genera las utilidades: `bg-surface`,
`text-ink-muted`, `border-line`, `fill-glyph-blue`…). Las clases se escriben siempre literales.

## Dirección

Tinta azul oscura y calmada, acentos violeta-azul (acciones) y ámbar (destacados), colores de
categoría suaves. Ni neón ni gradientes por todas partes: un único degradado sutil en la cabecera
del inicio. Tipografía sans del sistema (Inter si está instalada); la mono sólo en código y cifras.

## Tokens

| Grupo       | Tokens                                                                                     | Uso                                         |
| ----------- | ------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Superficies | `canvas`, `surface`, `raised`, `line`, `line-strong`                                       | fondo, tarjetas, controles, bordes          |
| Texto       | `ink`, `ink-soft`, `ink-muted`                                                             | títulos, cuerpo, secundario (≥ 4.5:1)       |
| Marca       | `brand`, `brand-strong`, `brand-ink`, `glow`                                               | acciones, foco, destacados                  |
| Feedback    | `success`, `danger`, `warning`                                                             | siempre con icono/texto además del color    |
| Categorías  | `cat-memory`, `cat-logic`, `cat-speed`, `cat-attention`, `cat-patterns`, `cat-programming` | siempre con etiqueta e icono                |
| Glifos      | `glyph-red/orange/yellow/green/blue/purple`                                                | estímulos de juego, ≥ 3:1 sobre superficies |
| Forma       | `--radius-card`, `--shadow-card`                                                           | tarjetas                                    |
| Movimiento  | `animate-pop`, `animate-fade-in`, `animate-flip` (≤ 220 ms)                                | revelar, resaltar, voltear                  |

La escala `slate-*` se re-tiñó con la misma paleta, de modo que las pantallas antiguas escritas con
`slate` comparten el aspecto nuevo.

## Preferencias que el CSS respeta

- `html[data-text-size=large|x-large]`: 112,5 % / 125 % (todo está en `rem`).
- `html[data-motion=reduce]` y `prefers-reduced-motion`: animaciones y transiciones a ~0 ms.
- `html[data-comfort=on]`: altura mínima de 44 px en botones y enlaces.

## Componentes

| Componente                                                                               | Ubicación                                |
| ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| Button / ButtonLink (primary, secondary, ghost, danger)                                  | `components/ui/Button.tsx`               |
| Card, StatTile, Badge, ProgressBar                                                       | `components/ui/`                         |
| Icon (36 iconos SVG propios)                                                             | `components/ui/Icon.tsx`                 |
| Sidebar + navegación                                                                     | `components/navigation/`                 |
| AppShell (sidebar, drawer móvil, avisos)                                                 | `components/layout/AppShell.tsx`         |
| PageHeader                                                                               | `components/layout/PageHeader.tsx`       |
| Respuestas: Choice, Numeric, Ordering, Sequence                                          | `components/response/`                   |
| Kit de juego: Glyph, ObjectFace, CellGrid, MultiSelectBoard, PairsBoard, TapStage        | `games/kit/ui/`                          |
| Feedback: AnswerFeedback (explicación), BriefFeedback (marca breve)                      | `features/play/`                         |
| Toggle (switch), radiogroups, tablas                                                     | `features/settings`, `features/progress` |
| Estados: PageLoading, LoadError, NotFound, RouteError, estados vacíos con siguiente paso | `features/shared/`                       |

## Reglas

- El estado activo / correcto / incorrecto nunca depende sólo del color (barra + peso + `aria-current`;
  ✓ ✗ • en las celdas; texto en el feedback).
- Foco visible (`outline-brand`) en todo elemento interactivo.
- Objetivos táctiles ≥ 40 px (44 px con confort).
- Sin hover imprescindible: todo funciona con toque y teclado.

## Pendiente

Tema claro (los tokens están preparados para redefinirse bajo `[data-theme=light]`), contraste
reforzado opcional.
