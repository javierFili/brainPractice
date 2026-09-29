# Bug Hunter — diseño del juego

> Área: **attention** · id: `bug-hunter` · código en `src/games/bug-hunter/`

## Propósito

Depurar es, sobre todo, **mirar con una regla en la cabeza**: recorrer un log buscando la línea
fuera de orden, validar registros contra un esquema, revisar un programa buscando la variable leída
antes de asignarse. **Bug Hunter** entrena exactamente eso: un único artefacto (log, registros o
pseudocódigo), un conjunto de reglas **explícitas** y muchos elementos parecidos, de los cuales
**exactamente uno** rompe **exactamente una** regla. El jugador lo señala (formato de respuesta
`locate`, `itemCount` = número de elementos).

No es un juego de velocidad pura: el límite de tiempo es generoso y crece con el tamaño del
artefacto. La dificultad está en la **atención selectiva** (solo cuentan las reglas enunciadas, no
lo que "parece raro"), la **atención sostenida** (el bug puede estar en el elemento 37 de 42) y la
resistencia a los **near-misses**: valores inusuales pero legales colocados a propósito.

## Habilidades de pensamiento de programación

| Habilidad             | Dónde se entrena                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `attention`           | Todos los tipos: recorrer cada elemento contra cada regla sin saltarse ninguno.                              |
| `debugging`           | Todos: localizar la anomalía y explicar qué regla rompe (la explicación da el número y el motivo).           |
| `abstraction`         | `schema-violation`: tratar cada campo como un tipo (enum, rango, formato) e ignorar los valores concretos.   |
| `pattern-recognition` | `sequence-anomaly`: detectar la ruptura de un patrón (consecutivo, ascendente, sin repetidos).               |
| `working-memory`      | `multi-rule`: sostener 2–3 reglas de familias distintas a la vez, incluida una condicional.                  |
| `logical-reasoning`   | `code-rule`: seguir el estado de un programa (qué variables existen, qué recursos están abiertos) por línea. |

## Modelo

- El contenido es **datos estructurados**, nunca texto libre: `DataRecord` (campos → valor) o
  `CodeLine` (`set`, `print`, `open`, `write … to`, `close`), más una lista de reglas tipadas
  (`SequenceRule | ValueRule | ConditionalRule | CodeRule`). La UI y la explicación se derivan de
  esos datos (`content/format.ts`).
- Los valores "normales" de cada campo (`generators/fields.ts`) cumplen **todas** las plantillas de
  regla que el juego puede enunciar, y los programas generados cumplen las cuatro reglas de código.
  Por tanto el artefacto nunca contiene un "bug" no enunciado: solo el inyectado.
- Cada regla tiene un **plan** (`generators/rulePlans.ts`): cómo construir un near-miss legal y cómo
  romperla en un elemento (`obvious` o `subtle` según el nivel).
- **Garantía de unicidad**: tras construir el candidato, el checker (`solvers/`) evalúa cada
  elemento contra cada regla; `retryGeneration` solo acepta candidatos con **exactamente una**
  violación y en el elemento elegido. Los tests lo verifican de nuevo con un **oráculo
  independiente** (`content/__tests__/oracle.ts`), escrito aparte a partir del texto de las reglas.
- Las reglas relacionales comparan cada elemento **solo con el de arriba** (lo dice el texto de la
  regla), así un hueco o un duplicado señala un único elemento: el siguiente sigue contando desde el
  valor erróneo y es válido.
- **Identificadores únicos**: `id`, `email`, `user`, `req` y `seq` nunca se repiten entre elementos
  (un duplicado exacto parecería un bug aunque ninguna regla lo prohíba). La única excepción es el
  propio bug cuando la regla enunciada es `unique` (`req`) o `consecutive` (`seq` repetido). Los
  señuelos de identificador son parecidos (1000 vs 1001, un carácter distinto), nunca iguales; el
  generador rechaza cualquier candidato con otro duplicado.
- **Variedad del bug**: la regla que se rompe se elige primero y de forma uniforme dentro del pool
  del nivel (y en `multi-rule`, entre las 5 reglas posibles, no entre familias); el resto del
  conjunto de reglas se completa alrededor de ella.
- Sin trucos tipográficos: los ids de petición usan el alfabeto `abcdef23456789` (sin 0/1, sin o/l);
  las variantes erróneas son errores reales de programación (typo, mayúsculas, valor fuera de rango).
- Generación < 1 ms por challenge de media en nivel 10 (test: < 20 ms), determinista por seed.

## Tipos de challenge

### `sequence-anomaly` — orden entre líneas de log

- **Objetivo**: detectar la línea que rompe un patrón secuencial.
- **Reglas** (1–3, según `decisionCount`, del pool `sequenceRules`): `time` igual o posterior al de
  arriba; `seq` exactamente +1 respecto al de arriba; (nivel 4+) ningún `req` repite uno anterior.
- **Ejemplo**: `time=12:38:56 seq=4902 level=ERROR` · `time=12:39:08 seq=4903 level=WARN` ·
  `time=12:39:44 seq=4903 level=INFO` → el elemento 3 rompe "seq +1" (debería ser 4904).
- **Violaciones**: _obvias_ — hora varios minutos atrás, salto de 10–40 en `seq`, `req` duplicado de
  la línea anterior. _Sutiles_ — 1–4 segundos atrás (a menudo cruzando un minuto), hueco de 1 o
  número repetido, `req` duplicado de una línea lejana.
- **Near-misses**: misma hora exacta que la línea anterior (legal: "igual o posterior"), `seq` que
  cruza una centena (1099 → 1100), `req` que difiere en un solo carácter de otro.

### `schema-violation` — registros contra un esquema

- **Objetivo**: validar registros tipo objeto contra 1–3 restricciones de campo.
- **Plantillas** (`schemaFields`): `id` de 4 cifras, `email` (`name@domain.tld`), `status` ∈
  {active, inactive, pending}, `retries` 0–5; nivel 3+: `role`, `region`, `port` 8000–8999; nivel
  5+: `version` semver, `timeoutMs` múltiplo de 250.
- **Ejemplo**: `{ id: 6018, retries: 7, role: "admin", port: 8422, timeoutMs: 1750 }` con la regla
  "retries 0–5" → rompe la regla.
- **Violaciones**: _obvias_ — `retries: 12`, `status: "deleted"`, email sin `@`. _Sutiles_ — `6`, `7`, `8`, `-1`,
  `"actve"`, `"Active"`, `"enabled"`, `ana@@corp.io`, `ana@corp.`, `1.4`, `v1.4.2`, `1200` (múltiplo
  de 100 pero no de 250), `port: 7999/7990/9000/9001`, ids de 3 o 5 cifras.
- **Near-misses**: valores en el límite (`retries: 0/5`, `port: 8000/8999`, `id: 1000/9999/1001/9990…`, sin repetir ids), emails
  con punto, `+tag`, subdominio o guion, `10.0.0`, `timeoutMs: 1750`. Se reparten en round-robin
  entre las reglas, así que cada regla tiene al menos un señuelo cuando `distractors` ≥ reglas.

### `code-rule` — revisión de pseudocódigo

- **Objetivo**: seguir el estado de un programa línea a línea y encontrar la que rompe una regla.
- **Reglas** (`codeRules`): toda variable se asigna antes de leerse; nombres en camelCase; (nivel
  4+) todo `open x` tiene un `close x` posterior; `write … to x` solo mientras `x` está abierto.
- **Ejemplo**: `11. close queue` … `19. write offset to queue` → el 19 escribe en un recurso ya
  cerrado.
- **Violaciones**: _obvias_ — leer un nombre que no aparece en ningún sitio, `TOTAL_PRICE`, escribir
  a un recurso que nunca se abre. _Sutiles_ — leer una variable que se asigna **más abajo**, o el
  plural de una existente (`subtotals`); `total_price` / `TotalPrice`; escribir en un recurso ya
  cerrado o todavía no abierto. `close-opened` sustituye un `close` por un `print` y el elemento
  culpable es el `open` sin cierre.
- **Near-misses**: pares de nombres legales casi iguales definidos ambos (`total`/`totals`,
  `count`/`counter`, `userId`/`userIds`…, más pares cuantos más `distractors`), nombres con dígitos
  (`v2Total`, `retry3`), bloques de recursos intercalados y cierres lejanos.
- Unicidad reforzada: además de las reglas enunciadas, el generador exige que **ninguna** de las
  cuatro reglas de código tenga otra violación.

### `multi-rule` — varias familias de reglas a la vez (nivel 5+)

- **Objetivo**: comprobar cada línea contra reglas de naturaleza distinta, alternando el tipo de
  chequeo: relacional (con la línea de arriba), de campo, y condicional entre campos.
- **Reglas**: 2 (niveles 5–6) o 3 (7–10): una relacional (`time` ascendente o `seq` +1) + una de
  campo (`level` ∈ {INFO, WARN, ERROR} o `ms` 0–500) + la condicional "cuando `level` es ERROR,
  `code` está entre 500 y 599".
- **Ejemplo**: `seq=2805 level=ERROR svc=search code=404` → rompe la condicional.
- **Violaciones**: `ERROR` con 4xx (sutil) o 2xx (obvia); `WARNING`, `ERR`, `Info` (sutil) o
  `DEBUG` (obvia); `ms=501–510` (sutil) o `ms=900+`; más las relacionales anteriores.
- **Near-misses**: `WARN` con código 5xx (la condicional no dice nada de WARN), `ms=0/500`, más los
  relacionales.

## Niveles

Ejes que crecen a la vez: elementos (`elementCount`), reglas simultáneas (`decisionCount`), campos
sin regla por elemento (`visualNoise`), señuelos legales (`distractors`), sutileza de la violación
y familias de reglas disponibles. Sin fase de estudio (`studyMs: null`).

| Nivel | Tier         | Objetivo                                             | Elementos | Reglas | Límite / objetivo | Ruido / señuelos / violación | Novedad                                                     |
| ----- | ------------ | ---------------------------------------------------- | --------- | ------ | ----------------- | ---------------------------- | ----------------------------------------------------------- |
| 1     | Fundamentals | Una regla, lista corta, elemento a elemento          | 6         | 1      | 60 s / 20 s       | 0 / 1 / obvia                | Logs (orden) y registros (esquema básico)                   |
| 2     | Fundamentals | Leer pseudocódigo como datos                         | 8         | 1      | 75 s / 25 s       | 1 / 2 / obvia                | `code-rule` (asignar antes de leer, camelCase)              |
| 3     | Fundamentals | Bugs sutiles: typos, off-by-one, segundos            | 10        | 1      | 90 s / 32 s       | 1 / 3 / sutil                | Violaciones sutiles; `role`, `region`, `port`               |
| 4     | Intermediate | Dos reglas; recursos abiertos y cerrados             | 14        | 2      | 110 s / 42 s      | 1 / 4 / sutil                | 2 reglas; `unique` en `req`; reglas de recursos             |
| 5     | Intermediate | Familias mezcladas: relacional + campo               | 18        | 2      | 130 s / 52 s      | 2 / 6 / sutil                | `multi-rule`; `version` semver, `timeoutMs` múltiplo de 250 |
| 6     | Intermediate | Artefactos largos con más señuelos                   | 22        | 2      | 150 s / 62 s      | 2 / 8 / sutil                | Atención sostenida (más de 20 elementos)                    |
| 7     | Advanced     | Tres reglas, incluida una condicional                | 26        | 3      | 170 s / 75 s      | 3 / 10 / sutil               | 3 reglas simultáneas; más peso de `multi-rule`              |
| 8     | Advanced     | Denso: casi todo lo sospechoso es legal              | 30        | 3      | 190 s / 85 s      | 3 / 12 / sutil               | Señuelos en ~40 % de los elementos                          |
| 9     | Expert       | Tres reglas sobre tres docenas de elementos ruidosos | 36        | 3      | 220 s / 100 s     | 4 / 15 / sutil               | 4 campos de ruido; líneas de log con 7–8 campos             |
| 10    | Expert       | Todo a la vez                                        | 42        | 3      | 250 s / 115 s     | 4 / 20 / sutil               | 42 elementos, casi la mitad señuelos                        |

- **Tipos por nivel**: 1 → `sequence-anomaly`, `schema-violation`; 2–4 → + `code-rule`; 5–6 → +
  `multi-rule` (pesos iguales); 7–10 → `multi-rule` ×1.5, `sequence-anomaly` ×0.75.
- **Justo pero difícil (9–10)**: todas las reglas están escritas, cada regla relacional compara solo
  con el elemento de arriba, no hay trucos tipográficos, y la explicación dice qué elemento, qué
  regla y por qué ("Item 31 is the bug: level is ERROR but code=400. It breaks rule 2: …").

Invariantes comprobados por tests: tabla válida (`validateLevelTable`); elementos estrictamente
crecientes, reglas/ruido/señuelos/tiempos no decrecientes; violaciones obvias solo en 1–2;
`multi-rule` solo en 5–10; en 40 seeds (derivadas con `deriveSeed`, como en una sesión) × 10 niveles: la solución se acepta y cualquier otro elemento
se rechaza, el oráculo independiente encuentra exactamente una violación y es la solución, la
explicación empieza por "Item n", los tipos respetan el nivel, cada regla de rango tiene un señuelo
en su límite, ningún identificador se repite salvo el bug enunciado, en niveles 7–10 cada regla
del pool de cada tipo es el bug al menos una vez, y un challenge de nivel 10 se genera en < 20 ms.

## UI

`ui/BugHunterContentView.tsx`: panel de reglas (borde `rose-400/40`, `R1…R3`) y lista numerada y
densa (`font-mono`) de botones accesibles por teclado con `aria-label` "Item n: …". Respeta
`locate.disabled`. En revisión marca el bug con "✗ breaks rule Rk: …" y la elección del jugador con
"your pick" / "✓ your pick", en texto además de color.
