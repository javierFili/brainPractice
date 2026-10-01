# Learning Design

Cómo enseña la plataforma. La implementación técnica está en [LEARNING_ENGINE.md](LEARNING_ENGINE.md).

## Principio: pensamiento antes que sintaxis

Programming Logic enseña **cómo piensan los programas** (valores, decisiones, repetición,
abstracción, algoritmos, depuración) en un pseudocódigo neutral. No se enseña Python, Java ni
JavaScript: la sintaxis se parece a Python porque es la más legible para principiantes, pero los
conceptos se transfieren a cualquier lenguaje.

## Las cinco preguntas

Para cada concepto, el contenido debe poder responder:

1. ¿El alumno **lo entiende**? → explicación + ejercicio de comprensión (`understanding`).
2. ¿**Lo reconoce** en código? → elección múltiple / emparejar.
3. ¿**Lo aplica**? → predecir resultados, completar código, construir algoritmos (`application`).
4. ¿**Detecta errores**? → ejercicios de depuración con "¿por qué está mal?" (`debugging`).
5. ¿**Resuelve un problema** con él? → block-builder y predicciones combinadas en el checkpoint.

Las tres dimensiones de mastery (`understanding`, `application`, `debugging`) son obligatorias en
cada lección (lo comprueba `validateLesson`).

## El arco de una lección

```text
Explicación corta ──▶ Ejemplo interactivo (playground) ──▶ Ejercicios guiados (pistas, 3 intentos)
       ──▶ Segunda idea (explicación / playground) ──▶ Práctica (2 intentos)
       ──▶ Checkpoint (1 intento, sin pistas, cuenta doble) ──▶ Resumen: puntos clave, mastery,
           siguiente lección, entrenamiento relacionado, repaso programado
```

- **Explicaciones**: 1–3 frases por párrafo, un ejemplo de código, como mucho un _callout_. Los
  diagramas de flujo (`flow`) se usan cuando la idea es visual (decisiones).
- **Playgrounds**: el alumno cambia valores de entrada (sliders, campos, selectores) y ve la salida, las
  variables, qué líneas se ejecutaron y un paso a paso. Cada playground propone 1–3 cosas concretas
  que probar ("Pon age = 18 exactamente. ¿Qué rama se ejecuta?").
- **Checkpoint**: la mini-evaluación. Sin pistas y con un solo intento, porque es lo que demuestra que
  la idea está aprendida.

## Feedback que enseña

- Nunca solo "Incorrecto". Primero **tu respuesta** y **por qué es tentadora y errónea** (cada
  distractor tiene su _misconception_ redactada; cada error típico de predicción, su explicación).
- Mientras quedan intentos, **no se revela la solución**: se muestra el diagnóstico y la siguiente
  pista. "Show solution" está siempre disponible, pero revelar cuenta como no aprendido.
- La explicación final dice **por qué** la respuesta correcta es correcta, en 1–3 frases
  ("x vale 10, así que x > 5 es true y el programa entra en la primera rama").

## Mastery y progreso honestos

- Una lección se **supera** con ≥ 60 % (checkpoint ×2), no pulsando "Complete".
- El mastery mide evidencia: acertar a la primera vale 1, al segundo intento 0,5, revelar 0, pedir
  pistas resta un poco. Hacer clic hasta acertar no produce mastery.
- Lo aprendido vuelve en **repasos espaciados** (1, 3, 7, 14, 30 días), cortos y opcionales.

## Curriculum — Module 1: How Programs Think

| #   | Lección                    | Objetivo ("You will be able to…")                                                                                                              | Ejercicios | Tipos                                                                                      | Entrenamiento relacionado                                                    |
| --- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1   | What is a Program?         | explain what a program is and predict what a tiny program prints.                                                                              | 8          | multiple-choice, prediction, matching, ordering, debugging                                 | Bug Hunter L1                                                                |
| 2   | Instructions and Sequences | trace a short program line by line and explain why changing the order of its lines changes the result.                                         | 9          | multiple-choice, prediction, ordering, block-builder, debugging                            | Algorithmic Logic L1 · Code Memory L1                                        |
| 3   | Values and Variables       | track the value of each variable through several assignments and tell numbers, text and true/false apart.                                      | 9          | multiple-choice, prediction, matching, code-completion, debugging                          | Code Memory L2 · Code Scan L1                                                |
| 4   | Conditions                 | predict which branch of an if / elif / else runs for a given value, including values right on the boundary.                                    | 9          | multiple-choice, prediction, matching, code-completion, debugging                          | Algorithmic Logic L2 · Bug Hunter L2                                         |
| 5   | Logical Operators          | combine true/false questions with and, or and not, and translate a rule written in words into a condition.                                     | 9          | multiple-choice, prediction, code-completion, block-builder, matching, debugging           | Algorithmic Logic L4 · Pattern Architect L2                                  |
| 6   | Loops                      | trace a while or for loop pass by pass, predict the values it leaves behind, and spot loops that never stop or run one time too few.           | 9          | prediction, multiple-choice, code-completion, debugging                                    | Code Memory L3–L4 · Pattern Architect L3 · Bug Hunter L3                     |
| 7   | Functions                  | define a function, call it with arguments, and use the value it returns.                                                                       | 9          | multiple-choice, prediction, matching, code-completion, debugging                          | Pattern Architect L4 · Algorithmic Logic L3                                  |
| 8   | Problem Decomposition      | split a problem into sub-problems with clear inputs and outputs, and connect them as small functions.                                          | 9          | multiple-choice, block-builder, prediction, ordering, code-completion, debugging, matching | Algorithmic Logic L5                                                         |
| 9   | Algorithms                 | describe an algorithm as a precise recipe, trace the classic list algorithms (sum, count, largest, search) and estimate how much work they do. | 9          | multiple-choice, prediction, block-builder, code-completion, debugging, matching           | Pattern Architect L5 · Algorithmic Logic L6 · Code Memory L4 · Bug Hunter L3 |
| 10  | Debugging                  | find and explain bugs with a method: reproduce, read the message, trace values, form a hypothesis, change one thing and re-test.               | 9          | ordering, debugging, multiple-choice, prediction, matching                                 | Bug Hunter L3 · Code Scan L3                                                 |

89 ejercicios en total; la posición de la opción correcta varía y no tiende a ser la más larga (5 de
20 preguntas de elección múltiple, el azar daría ~5,7).

## Conexión con TRAIN

Cada concepto declara `cognitiveLinks`: qué juego y nivel practican la habilidad que el concepto exige,
con una frase de por qué ("Seguir un bucle es actualizar valores en la cabeza en cada vuelta → Code
Memory L3"). Se usan en el resumen de la lección, en las recomendaciones del dashboard y, a la inversa,
en los resultados de cada juego ("Where this skill shows up in programming"). Son **sugerencias de
práctica**, no afirmaciones de que un juego cause aprendizaje.

## Reglas de contenido

- Sin texto genérico ni de relleno; cada párrafo enseña algo concreto.
- Ejemplos con cosas reales (precios, notas, entradas de cine), nunca `foo/bar`.
- Distractores plausibles basados en errores reales de principiantes (`=` vs `==`, `>` vs `>=`,
  bucle sin fin, `print` en lugar de `return`, sobrescribir en lugar de acumular).
- Nada de afirmaciones sobre inteligencia o "mejorar el cerebro".

## Próximos módulos (propuesta)

Module 2 _Working with Data_ (listas a fondo, diccionarios, cadenas), Module 3 _Algorithmic Thinking_
(búsqueda, ordenación, recursión, complejidad), Module 4 _From Pseudocode to a Real Language_ (puente a
Python o JavaScript con el mismo modelo mental).
