# Product Value — "I would pay for this" test

> Pregunta guía: _si yo fuera una persona aprendiendo programación, ¿qué valor real recibo hoy?_
> Evaluación honesta del estado en `a5b0701` + Phase 1.

## Current Value

- **Práctica deliberada de lectura de código** en cinco habilidades concretas (trazar pseudocódigo,
  retener estado, comparar código, detectar anomalías, abstraer reglas), con 10 niveles calibrados
  y dificultad que crece de verdad.
- **Feedback que explica** cada respuesta (traza de variables en Memory, regla violada en Bug
  Hunter, regla del patrón en Pattern Architect).
- **Sesiones cortas** (6–15 challenges, 2–6 min) y reproducibles por seed.
- **Honestidad**: disclaimers claros, sin afirmaciones de IQ ni mejoras clínicas.

Para una persona que _ya programa un poco_, esto es un buen "gimnasio" de 5 minutos.
Para alguien que **está aprendiendo desde cero**, hoy no enseña nada de forma estructurada.

## Missing Value

1. **Aprender**: no hay lecciones, conceptos ni camino. La persona no sabe qué estudiar ni por qué.
2. **Progreso en el tiempo**: solo "best" por nivel; no se ve "hace dos semanas acertabas el 60 %
   de las trazas con bucles, hoy el 85 %".
3. **Plan personal**: nada sugiere qué hacer hoy según el objetivo y las debilidades.
4. **Revisión**: lo aprendido no vuelve cuando se está olvidando.
5. **Conexión juego ↔ programación real**: el jugador no ve para qué le sirve cada juego en código.

## Differentiation

Frente a apps de "brain training" genéricas y a cursos de programación:

|                  | Brain training genérico     | Cursos de programación  | Esta plataforma                                     |
| ---------------- | --------------------------- | ----------------------- | --------------------------------------------------- |
| Contenido        | abstracto (formas, números) | sintaxis de un lenguaje | **habilidades cognitivas sobre material de código** |
| Aprende a pensar | implícito, no transferido   | se asume                | explícito: concepto ↔ habilidad cognitiva           |
| Medición         | puntos                      | ejercicios aprobados    | mastery por dimensión + perfil cognitivo            |
| Honestidad       | a menudo exagera            | n/a                     | sin claims cognitivos no demostrados                |

El diferenciador defendible es la **integración TRAIN ↔ LEARN**: "estás aprendiendo bucles; lo que
más te cuesta es seguir el estado entre iteraciones; esta práctica de 2 minutos entrena exactamente
eso". Ninguna de las dos categorías lo hace.

## Retention

Por qué volvería (legítimamente), una vez implementado el roadmap:

- **Hay algo nuevo que aprender hoy**: la siguiente lección desbloqueada.
- **Hay algo que repasar**: conceptos cuya revisión vence hoy (repetición espaciada).
- **Veo que mejoro**: evolución por concepto y por habilidad, no solo récords.
- **Daily challenge**: mismo reto para todos ese día, 2–3 minutos.
- **Un objetivo que elegí yo** ("Programming Logic en 3 semanas") con ritmo realista.

Sin falsas urgencias, sin rachas que castiguen, sin bloqueo artificial del progreso.

## Monetization

Por qué eventualmente pagaría: cuando el producto **me ahorra tiempo y me hace avanzar más rápido**
de lo que avanzaría solo. Hipótesis (no implementar aún):

- **Free**: los 5 juegos (niveles 1–10), el primer módulo de Programming Logic, progreso básico,
  daily challenge. Debe ser valioso por sí mismo.
- **Premium**: learning path completo (módulos siguientes), repetición espaciada y plan adaptativo,
  analítica detallada por concepto/habilidad, challenges de debugging y algoritmos avanzados,
  sincronización entre dispositivos.

Condición previa: demostrar retención en el tramo gratuito. Cobrar antes de eso es cobrar por
promesas.

## Risks

| Riesgo                           | Por qué haría abandonar                                     | Mitigación                                                                                                |
| -------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Medición que se puede "hackear"  | si puedo acertar sin pensar, los números no significan nada | P0/P1 de Phase 1 + tests de invariantes de adivinabilidad                                                 |
| Contenido genérico en lecciones  | se nota enseguida y rompe la confianza                      | 10 lecciones muy trabajadas, verificadas por intérprete                                                   |
| Frustración en niveles altos     | L10 de Memory/Code Scan son muy exigentes                   | todos los niveles abiertos, recomendación de nivel, modo relajado                                         |
| Pérdida de progreso              | localStorage se borra o se corrompe                         | recuperación parcial (Phase 1), cuentas + sync (futuro)                                                   |
| Transferencia no demostrada      | "¿esto me hace mejor programador?"                          | no prometerlo; conectar cada juego con un concepto de programación explícito y medir mastery en lecciones |
| Solo en inglés / solo escritorio | mercado hispanohablante, uso en móvil                       | i18n preparado en Phase 6; pulido móvil                                                                   |
