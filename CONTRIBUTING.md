# Contribuir

## Configuración y comprobaciones

```bash
npm install
npm run dev
# before every commit / PR — all four must pass
npm run lint && npm run typecheck && npm test && npm run build
npm run format        # Prettier
```

Requiere Node ≥ 20.19. Las versiones están fijadas para Node 20 (ver ARCHITECTURE.md §14).

## Reglas básicas

- Respeta las capas (ARCHITECTURE.md §1). ESLint bloquea React, el DOM, `Math.random`, `Date.now` y
  `performance.now` dentro de `src/domain`, `src/engine` y `src/games/*/content`.
- Nada de `any`. Prefiere uniones discriminadas y `Result` para los fallos esperados.
- Nada de lógica de negocio en los componentes: los componentes leen estado e invocan comandos.
- Cada regla nueva lleva un test; cada generador lleva un oráculo independiente en sus tests.
- Justifica las dependencias nuevas en la descripción del PR.

## Añadir un juego

1. Crea `src/games/<game-id>/` con:
   - `content/types.ts` — unión de contenido (discriminante `kind`),
     `type XChallenge = Challenge<'<area>', XContent>` y `XProfile extends DifficultyProfile` con los
     parámetros de dificultad del juego.
   - `content/levels.ts` — `LevelTable<XProfile>` para **exactamente** los niveles 1–10 (tier, objective,
     `challengeCount`, `timing`, parámetros).
   - `content/generators/*.ts` — funciones puras `(random, profile) => draft`. Usa `retryGeneration` para
     rechazar candidatos de baja calidad y `singleChoice`/`numericResponse`/`locateResponse` para las
     respuestas.
   - `content/solvers/*.ts` — comprobaciones independientes que usan la generación y los tests.
   - `content/definition.ts` — la `GameDefinition` (`generate` elige un kind y devuelve
     `{ ...identity, ...draft, timing }`).
   - `ui/<X>ContentView.tsx` — renderiza `content` en cada `phase` (`study` / `respond` / `review`);
     renderiza las interacciones `locate` cuando el formato de respuesta es `locate`.
   - `index.ts` — `export const xModule = defineGameModule<XChallenge>({ definition, ContentView, kindLabels })`.
2. Regístralo en `src/games/registry.ts` (la única lista de juegos).
3. Añade tests en `content/__tests__/` (tabla de niveles, determinismo, comprobaciones de propiedades por
   nivel con un solver independiente) y `ui/*.test.tsx`.
4. Documéntalo en `docs/game-design/<game-id>.md` y enlázalo desde [GAME_DESIGN.md](GAME_DESIGN.md).

`createGameRegistry` valida la tabla de niveles al arrancar, así que una definición rota falla de
inmediato.

## Añadir o modificar un nivel

Los niveles viven en `src/games/<id>/content/levels.ts`. Mantén los invariantes que comprueban los tests
del juego (las dimensiones nunca decrecen, objetivo ≤ límite) y actualiza la tabla de niveles del
documento de diseño del juego. El tipo `LevelTable` exige los diez niveles; añadir un nivel 11 implica
ampliar `DifficultyLevel`, lo que es un cambio de dominio.

## Añadir un tipo de challenge

1. Añade una variante a la unión de contenido del juego y un generador que devuelva un draft.
2. Añádelo a los pesos de `kinds` de los perfiles de nivel donde deba aparecer.
3. Renderízalo en el content view y dale una etiqueta en `kindLabels`.
4. Añade tests de propiedades que demuestren unicidad y corrección con un oráculo independiente.

Si ninguno de los cuatro formatos de respuesta (`single-choice`, `ordering`, `locate`, `numeric`)
encaja, añadir un formato es un cambio de dominio: amplía `ResponseFormats`, `evaluateAnswer`,
`validateResponse`, los builders y un componente de respuesta, con tests para cada uno.

## Estrategias de scoring y de dificultad

Ver [GAME_ENGINE.md](GAME_ENGINE.md) → _Extensión_.

## Commits

Mensajes de estilo Conventional Commits (`feat(scope): …`, `fix: …`, `chore: …`). Mantén el contenido
generado reproducible: nunca cambies el PRNG ni `deriveSeed` sin actualizar deliberadamente los golden
tests.
