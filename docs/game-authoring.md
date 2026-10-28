# Cómo crear un juego (guía de autoría)

> Guía práctica y normativa para añadir juegos al catálogo. Ejemplos de referencia completos:
> `src/games/memory/memory-cards` (formato `pairs`), `src/games/memory/sequence-recall` (`sequence`),
> `src/games/memory/position-memory` (`multi-select`), `src/games/speed/reaction-test` (`tap`) y los
> juegos de `src/games/programming/*` (`single-choice`, `numeric`, `ordering`, `locate`).

## 1. Qué es un juego

Un juego es **una definición pura** (`GameDefinition`: datos + generador, sin React) **más una
vista** (`ContentView`, React) empaquetadas en un `GameModule`. Una sesión es una lista de
_challenges_ generados con una semilla; cada challenge se responde una vez, el dominio lo evalúa
(nunca la UI), se puntúa y se registra.

```text
src/games/<categoría>/<slug>/
├── content/            puro: sin React, sin DOM, sin Math.random ni Date.now (lo impone ESLint)
│   ├── types.ts        Content (unión discriminada por `kind`), Challenge, Profile
│   ├── levels.ts       10 niveles con defineLevels()
│   └── definition.ts   GameDefinition + generate()
├── ui/<Nombre>View.tsx la vista del contenido (y de la interacción, según el formato)
├── index.ts            defineGameModule({ definition, ContentView, kindLabels, renderOption? })
└── <slug>.test.tsx     describeGameContract(module) + tests específicos del juego
```

Registrar el módulo en `src/games/<categoría>/index.ts` (array `<CATEGORÍA>_GAMES`). Nada más:
el catálogo, las rutas, el progreso, el reto diario y las recomendaciones lo recogen solos.

## 2. Formatos de respuesta (`src/domain/challenge/responseFormats.ts`)

| Formato         | Para qué                                  | Quién dibuja la respuesta                                                      |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| `single-choice` | elegir una opción                         | el escenario (`ChoiceResponse`, teclas 1–n); la vista solo muestra el estímulo |
| `numeric`       | escribir un número exacto                 | el escenario (`NumericResponse`)                                               |
| `ordering`      | ordenar todos los elementos               | el escenario (`OrderingResponse`)                                              |
| `sequence`      | reproducir una secuencia desde una paleta | el escenario (`SequenceResponse`; usa `renderOption` para caras visuales)      |
| `locate`        | señalar un elemento del contenido         | la vista, con la prop `locate`                                                 |
| `multi-select`  | marcar un conjunto de celdas/elementos    | la vista, con `MultiSelectBoard` y la prop `respond`                           |
| `pairs`         | emparejar cartas ocultas                  | la vista, con `PairsBoard` y `respond`                                         |
| `tap`           | reaccionar (o contenerse) ante una señal  | la vista, con `TapStage` y `respond`                                           |

Constructores: `singleChoice(random, correct, distractors)`, `numericResponse`, `multiSelectResponse`,
`sequenceResponse`, `pairsResponse`, `tapResponse` (`@/domain/challenge`). `singleChoice` baraja
y rechaza etiquetas duplicadas.

La vista recibe `ContentViewProps`: `challenge`, `phase` (`study` | `respond` | `review`), `locate`,
`respond` (no nulo solo mientras se puede responder), `answer` (la respuesta dada, en `review`) y
`assisted` (modo relajado: ralentiza tu propia presentación).

**Fase de estudio**: si `timing.studyMs` no es `null`, el challenge empieza en `study` (el
escenario muestra `studyPrompt` y un botón "I'm ready") y pasa a `respond` al acabar el tiempo. La
vista decide qué se ve en cada fase (en `respond` el material memorizado debe estar oculto).

## 3. Niveles

`defineLevels<P>([...10 filas])` rellena `level` y `tier`. Cada fila: `objective` (frase visible
para el jugador), `challengeCount`, `timing` (`untimed(targetMs, studyMs?)` o
`timed(targetMs, limitMs, studyMs?)`) y los parámetros tipados del juego.

Reglas:

- Exactamente 10 niveles, **distintos en la tarea**, no solo en números o tiempo: más elementos,
  más reglas, distractores más parecidos, menos ayudas, combinaciones, abstracción.
- Nivel 1 = una regla, pocos elementos, sin presión temporal. Nivel 10 = máxima complejidad
  razonable, siempre verificable.
- Tests de progresión con `expectNonDecreasing(levels, p => p.x)` en los parámetros que suben.
- Límites de tiempo solo donde la velocidad es el objeto del juego. En el resto, `limitMs: null`.
- 3–8 challenges por sesión (sesiones de 2–6 minutos).

## 4. Generación: correcta, inequívoca, no adivinable

- Única fuente de azar: el `random` recibido (`randomInt`, `pick`, `sample`, `shuffle`,
  `chance`, `weightedPick` de `@/domain/random`). Misma semilla ⇒ mismo challenge.
- **La respuesta se calcula con un solver**, no se supone: genera el problema, resuélvelo con
  código, y si hay más de una respuesta válida (o ninguna), descarta el candidato con
  `retryGeneration(what, build)` (devuelve `null` para reintentar).
- **Distractores**: nunca derivados solo de la respuesta (si todos rodean la respuesta, "elige la
  del medio" acierta). Usa `rankedNumericOptions` para números (el rango de la respuesta es
  uniforme) y distractores plausibles e independientes para el resto. El contrato comprueba
  que la posición de la respuesta no está sesgada.
- Sin acertijos que dependan de interpretación, cultura o vocabulario raro. Contenido en inglés
  sencillo (la UI está en inglés).
- Generación rápida (< 5 ms de media por challenge).

## 5. Metadatos (`meta`)

```ts
meta: {
  category: 'memory',                  // memory | logic | speed | attention | patterns | programming
  audiences: ['kids', 'teens', 'adults', 'seniors'], // a quién se recomienda (nunca restringe)
  interaction: 'grid',                 // choice | grid | sequence | tap | pairs | ordering | numeric | mixed
  estimatedMinutes: 3,
  keyboard: 'full',                    // 'partial' si algún paso necesita puntero
  relaxedFriendly: true,               // false si sin límite de tiempo la tarea pierde sentido
  measures: ['accuracy'],              // accuracy | response-time | reaction-time | completion-time | streak
  scoringSummary: 'Frase honesta sobre cómo se calcula el resultado.',
  feedback: 'brief',                   // 'brief' (marca breve que avanza sola) | 'explain' (explicación)
  accessibilityNotes?: '…',            // limitaciones conocidas
}
```

`skills` (del juego y de cada challenge) salen de `@/domain/shared/skill.ts`. `scoring` permite
ajustar la fórmula estándar (p. ej. juegos de velocidad: `{ maxSpeedBonus: 1, accuracyWeight: 0.6 }`).

## 6. Lenguaje y diseño responsable

- Describir la tarea, nunca diagnosticar: "practise", "your result in this session". Prohibido:
  "your memory is weak", "IQ", "brain age", promesas de mejora o prevención.
- Instrucciones cortas y concretas (3–5 líneas) + `simpleInstructions` (una frase para niños).
- Accesibilidad: forma **y** color (`Glyph` siempre combina ambos y su etiqueta los nombra);
  cada elemento interactivo con nombre accesible; teclado completo (los botones del contenido
  ya se recorren con flechas desde el escenario); objetivos ≥ 40 px; nada de parpadeos rápidos
  (> 3 por segundo) ni animaciones necesarias para entender la tarea.
- Responsive: la cuadrícula debe caber en 360 px de ancho sin scroll horizontal (`CellGrid` usa
  `size="sm"` para cuadrículas grandes).

## 7. Kit compartido

Contenido puro (`@/games/kit/content`): `SHAPES`, `COLORS`, `Glyph`, `glyphLabel`, `distinctGlyphs`,
`nearGlyph`, `OBJECTS` (objetos cotidianos con emoji y nombre), `WORD_GROUPS`/`sampleWords`,
`defineLevels`, `untimed`, `timed`, `rankedNumericOptions`, `distinctInts`.

UI (`@/games/kit/ui`): `Glyph` (SVG), `ObjectFace`, `CellGrid`, `MultiSelectBoard`, `PairsBoard`,
`TapStage`, `useStepper` (presentar ítems uno a uno en la fase de estudio).

Tokens de diseño (Tailwind, `src/index.css`): `bg-canvas`, `bg-surface`, `bg-raised`, `border-line`,
`text-ink`, `text-ink-soft`, `text-ink-muted`, `bg-brand`, `text-glow`, `text-success`,
`text-danger`, `text-warning`, `fill-glyph-<color>`. Clases siempre literales (Tailwind no ve clases
construidas con plantillas).

## 8. Tests obligatorios

```ts
describeGameContract(module); // registro, reproducibilidad, solución aceptada, kinds etiquetados,
// variedad entre semillas, sin sesgo de posición, vista renderiza en todas las fases
```

Además, en cada juego:

1. **Corrección**: un oráculo independiente (o el solver) confirma la solución en todos los niveles
   para muchas semillas; para problemas de búsqueda, que la solución es **única**.
2. **Progresión** de los parámetros clave (`expectNonDecreasing`).
3. **Interacción** cuando la vista responde por sí misma (`multi-select`, `pairs`, `tap`): la
   vista envía la respuesta correcta con usuario simulado (`@testing-library/user-event`).

Sin esperas reales: temporizadores falsos (`vi.useFakeTimers()`) y relojes inyectados.

## 9. Validación local

```bash
npx vitest run src/games/<categoría>
npx eslint src/games/<categoría>
npx tsc --noEmit -p tsconfig.app.json
npx prettier --write src/games/<categoría>
```

Un juego solo se marca como **implementado** en `docs/game-catalog.md` cuando cumple todo lo
anterior: se inicia, explica sus reglas, genera desafíos válidos, recibe y evalúa respuestas,
da feedback, registra métricas, termina la sesión y muestra resultados.
