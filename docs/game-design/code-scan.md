# Code Scan — diseño del juego

> Área: **speed** · id: `code-scan` · código: `src/games/code-scan/`

## Propósito

Code Scan entrena la **velocidad de procesamiento** aplicada a código: comparar rápidamente dos
fragmentos casi idénticos y detectar el único token que cambió. Es la habilidad que se usa al revisar
un diff, al comparar una línea con la documentación o al buscar el error de copiar y pegar que rompe
un build. Se pide velocidad sin renunciar a la precisión: cada challenge tiene una única respuesta
correcta y una respuesta equivocada resta puntos.

Se muestran dos snippets de pseudocódigo neutral: **ORIGINAL** (izquierda, o arriba en móvil) y
**COPY** (derecha, o abajo). Si difieren, difieren en **exactamente un token de una sola línea**.

## Habilidades de programación entrenadas

- **attention**: comparar token a token sin dejarse llevar por la forma de la línea.
- **debugging**: reconocer los errores típicos (off-by-one, `<` por `<=`, variable equivocada,
  nombre mal escrito, condición negada).
- **pattern-recognition** (classify): nombrar la categoría del cambio, lo que en un code review
  permite decidir su impacto.

## Tipos de challenge (`content.kind`)

| Kind                  | Respuesta                    | Niveles   | Objetivo cognitivo                                     |
| --------------------- | ---------------------------- | --------- | ------------------------------------------------------ |
| `same-or-different`   | single-choice (2 opciones)   | 1–6, 9–10 | Decisión rápida igual / distinto sobre todo el snippet |
| `find-the-change`     | `locate` (línea de la copia) | 2–10      | Localizar la línea exacta que cambió                   |
| `classify-the-change` | single-choice (5 categorías) | 7–10      | Localizar y además clasificar el cambio                |

### same-or-different

- **Ejemplo**: `total ← total + price` frente a `total ← total - price` → **Different**.
- **Garantía**: con probabilidad 0,5 la copia es el mismo snippet; si no, se aplica exactamente una
  mutación del catálogo. Las opciones son fijas (`Identical`, `Different`) y en orden fijo para que
  las teclas 1/2 sean siempre las mismas. El test re-renderiza ambas columnas y comprueba que la
  solución coincide con la igualdad real del texto.

### find-the-change

- **Ejemplo**: en la línea 4, `if count < limit then` pasa a `if count <= limit then` → el jugador
  hace clic en la línea 4 de la copia.
- **Garantía**: una sola mutación sobre una sola línea; la solución es su índice. El test compara
  independientemente todas las líneas renderizadas y exige exactamente una distinta, igual a la
  solución, y que la diferencia sea un único token (sustitución o inserción de `not`).

### classify-the-change

- **Ejemplo**: `send(queue[2], budget)` → `sned(queue[2], budget)` → **Name misspelled**.
- Opciones fijas y siempre las cinco: _Operator changed_, _Variable swapped_, _Number changed_,
  _Name misspelled_, _Condition negated_.
- En L7–8 la línea cambiada se señala (marca de texto `check` y número de línea en el enunciado);
  en L9–10 no hay pista: primero hay que encontrarla.
- **Garantía de no ambigüedad**: cada categoría se reconoce solo con los dos tokens (ver catálogo).
  El único caso dudoso, sustituir un operador por su complemento lógico (`=` ↔ `≠`), también podría
  leerse como "condición negada", así que nunca se usa en este kind. El test clasifica el cambio
  por su cuenta (a partir del texto) y exige que coincida con la solución, y que aparezcan las cinco
  categorías.

## Catálogo de mutaciones

Todas cambian **un token semántico**, nunca un truco tipográfico: los nombres son solo minúsculas,
los números solo dígitos, ningún par de nombres del pool está a menos de 2 ediciones (test) y un typo
nunca crea pares que se confunden en algunas fuentes (`rn`, `cl`, `vv`, `ii`, `nn`, `ll`).

| Categoría  | Fina (`fine`)                          | Gruesa (`coarse`)                           | Regla que la identifica                           |
| ---------- | -------------------------------------- | ------------------------------------------- | ------------------------------------------------- |
| `operator` | `<`↔`<=`, `>`↔`>=`, `+`↔`-`, `=`↔`≠`\* | `<`↔`>`, `<=`↔`>=`, `+`/`-`↔`*`, `and`↔`or` | Ambos tokens son operadores                       |
| `variable` | `i`↔`j`                                | una variable escalar/array por otra         | El nuevo nombre ya aparece en el original         |
| `number`   | ±1 (off-by-one)                        | +4 / −4 (o +6)                              | Ambos tokens son números                          |
| `typo`     | transposición de dos letras interiores | omisión de una letra interior               | Nombre a distancia 1 que no aparece en el snippet |
| `negation` | —                                      | `not` insertado tras `if` / `while`         | Única inserción del catálogo                      |

\* Solo en `same-or-different` y `find-the-change`.

Se descartó **"argumentos intercambiados"** (`max(a, b)` → `max(b, a)`): cambia dos tokens y
rompería el invariante "exactamente un token", que es lo que hace cada challenge verificable.

Elección de la mutación: primero la línea (con probabilidad `visualNoise` dentro de una _run_ de
líneas casi idénticas), luego la categoría de forma uniforme entre las permitidas por el nivel, y
por último una variante fina con probabilidad `fineShare`.

## Snippets

Pseudocódigo neutral generado desde tokens (`keyword`, `name`, `func`, `number`, `operator`,
`punct`): asignaciones `total ← total + price`, accesos `items[i]`, llamadas `send(total, items[i])`,
`max`/`min`, bloques `if … then / else / end if`, `for i ← 0 to limit - 1 do … end for`,
`while … do … end while` y `return`. La primera línea inicializa una variable y la última es un
`return`; el snippet tiene exactamente `elementCount` líneas.

El **ruido visual** son _runs_ de 3–4 líneas que comparten plantilla y difieren en un único hueco:
`width ← width + step` / `height ← height + step`, `orders[0] ← price + 7` / `orders[1] ← …`,
`notify(costs[0], height)` / `notify(costs[1], height)`. Con `complexity: 2` aparecen condiciones
compuestas (`and` / `or`) y un `if` dentro de un `for`.

## Scoring: por qué el override

`scoring: { maxSpeedBonus: 1, accuracyWeight: 0.6 }`

- **maxSpeedBonus 1** (por defecto 0,5): la habilidad entrenada es la velocidad, así que responder
  al instante puede duplicar los puntos base. Sigue aplicándose solo a respuestas correctas y la
  penalización por error no cambia: adivinar rápido no compensa.
- **accuracyWeight 0,6** (por defecto 0,75): el ritmo pesa un 40 % del índice de rendimiento en vez
  de un 25 %, para que dos sesiones con la misma precisión se distingan por la velocidad. La
  precisión sigue siendo mayoritaria, porque detectar mal un cambio es peor que detectarlo lento.

## Niveles

Todos los niveles: `studyMs: null` (no hay fase de memorización; el contenido está siempre visible).

| Nivel | Tier         | Líneas | Límite / objetivo | Ruido | Fino | Kinds (peso)                     | Retos |
| ----- | ------------ | ------ | ----------------- | ----- | ---- | -------------------------------- | ----- |
| 1     | fundamentals | 4      | 20 s / 8 s        | 0     | 0    | same 1                           | 8     |
| 2     | fundamentals | 5      | 18 s / 8 s        | 0,1   | 0,2  | same 1, find 1                   | 8     |
| 3     | fundamentals | 6      | 18 s / 9 s        | 0,2   | 0,35 | same 1, find 1,5                 | 8     |
| 4     | intermediate | 7      | 16 s / 9 s        | 0,3   | 0,5  | same 0,5, find 1,5               | 10    |
| 5     | intermediate | 8      | 16 s / 9 s        | 0,4   | 0,6  | same 0,5, find 1,5               | 10    |
| 6     | intermediate | 9      | 15 s / 9 s        | 0,5   | 0,7  | same 0,5, find 1,5               | 10    |
| 7     | advanced     | 9      | 14 s / 8 s        | 0,55  | 0,75 | find 1, classify 1 (con pista)   | 10    |
| 8     | advanced     | 10     | 14 s / 8 s        | 0,6   | 0,8  | find 1, classify 1,5 (con pista) | 10    |
| 9     | expert       | 11     | 13 s / 8 s        | 0,7   | 0,85 | same 0,5, find 1, classify 1,5   | 10    |
| 10    | expert       | 12     | 12 s / 7 s        | 0,8   | 0,9  | same 0,5, find 1, classify 1,5   | 10    |

### Nivel 1

- **Objetivo**: comparar dos snippets cortos y decidir si son idénticos.
- **Dificultad**: fundamentals. **Longitud**: 4 líneas. **Límite**: 20 s (objetivo 8 s).
- **Complejidad / ruido**: bloques planos, sin runs; solo cambios gruesos de operador, variable o número.
- **Nuevo**: la tarea básica igual / distinto.

### Nivel 2

- **Objetivo**: señalar la línea exacta que cambió; entran los nombres mal escritos.
- **Dificultad**: fundamentals. **Longitud**: 5 líneas. **Límite**: 18 s (objetivo 8 s).
- **Complejidad / ruido**: planos; ruido 0,1; 20 % de cambios finos.
- **Nuevo**: respuesta `locate` (find-the-change) y la categoría `typo`.

### Nivel 3

- **Objetivo**: condiciones negadas y cambios de un carácter: leer cada token, no la forma.
- **Dificultad**: fundamentals. **Longitud**: 6 líneas. **Límite**: 18 s (objetivo 9 s).
- **Complejidad / ruido**: planos; ruido 0,2; 35 % finos.
- **Nuevo**: la categoría `negation`; catálogo completo.

### Nivel 4

- **Objetivo**: bloques anidados y condiciones compuestas: más sitios donde esconder el cambio.
- **Dificultad**: intermediate. **Longitud**: 7 líneas. **Límite**: 16 s (objetivo 9 s).
- **Complejidad / ruido**: `complexity 2` (`if` dentro de `for`, `and` / `or`); ruido 0,3; 50 % finos.
- **Nuevo**: anidamiento y operadores lógicos como objetivo de mutación; predomina find-the-change.

### Nivel 5

- **Objetivo**: runs de líneas casi idénticas: comparar token a token.
- **Dificultad**: intermediate. **Longitud**: 8 líneas. **Límite**: 16 s (objetivo 9 s).
- **Complejidad / ruido**: ruido 0,4; 60 % finos.
- **Nuevo**: las runs pasan a ser frecuentes y el cambio suele caer dentro de ellas.

### Nivel 6

- **Objetivo**: listados más largos con menos tiempo; la mayoría de cambios son de un carácter.
- **Dificultad**: intermediate. **Longitud**: 9 líneas. **Límite**: 15 s (objetivo 9 s).
- **Complejidad / ruido**: ruido 0,5; 70 % finos.
- **Nuevo**: presión de tiempo por línea claramente mayor (≈1,7 s por par de líneas).

### Nivel 7

- **Objetivo**: nombrar el tipo de cambio: operador, variable, número, typo o negación.
- **Dificultad**: advanced. **Longitud**: 9 líneas. **Límite**: 14 s (objetivo 8 s).
- **Complejidad / ruido**: ruido 0,55; 75 % finos.
- **Nuevo**: classify-the-change con pista (la línea se marca `check`).

### Nivel 8

- **Objetivo**: clasificar cambios finos escondidos entre líneas parecidas, más rápido.
- **Dificultad**: advanced. **Longitud**: 10 líneas. **Límite**: 14 s (objetivo 8 s).
- **Complejidad / ruido**: ruido 0,6; 80 % finos.
- **Nuevo**: classify pasa a ser el kind más frecuente.

### Nivel 9

- **Objetivo**: encontrar y clasificar el cambio sin pista.
- **Dificultad**: expert. **Longitud**: 11 líneas. **Límite**: 13 s (objetivo 8 s).
- **Complejidad / ruido**: ruido 0,7; 85 % finos.
- **Nuevo**: classify sin línea marcada (dos pasos: localizar y nombrar); vuelve same-or-different,
  ahora con cambios de un carácter en 11 líneas.

### Nivel 10

- **Objetivo**: doce líneas densas y casi idénticas y un cambio de un carácter, a máxima velocidad.
- **Dificultad**: expert. **Longitud**: 12 líneas. **Límite**: 12 s (objetivo 7 s, ≈1 s por par de líneas).
- **Complejidad / ruido**: ruido 0,8; 90 % finos.
- **Nuevo**: el máximo de todos los ejes a la vez. Difícil pero justo: sigue habiendo un único
  token distinto y una única respuesta correcta.

## Verificación (tests)

- `content/__tests__/codeScanGame.test.ts`: tabla de niveles válida y monótona (longitud, ruido,
  finura y complejidad no decrecen; el límite no crece; las categorías se acumulan), pools sin
  nombres cercanos, determinismo por `(level, seed)`, y sobre 30 seeds × 10 niveles: la solución
  se acepta, diff independiente de un único token en una única línea, same-or-different coherente
  con la igualdad real (≈50 % idénticos), find-the-change apunta a la línea distinta, classify
  coincide con la categoría deducida del texto, sin trucos tipográficos, la explicación contiene la
  respuesta, runs frecuentes en expert, y generación < 20 ms por challenge en L10.
- `ui/CodeScanContentView.test.tsx`: clic y teclado llaman a `onLocate` con el índice, el binding
  deshabilitado lo impide, y en review se muestran las marcas de texto `changed` / `your pick`.
