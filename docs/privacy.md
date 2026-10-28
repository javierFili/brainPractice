# Privacidad y diseño responsable

## La demo

- Sin cuentas, sin servidor, sin analítica, sin cookies de terceros, sin publicidad.
- Todo se guarda en `localStorage` del navegador, en cuatro claves versionadas:
  `brain-practice:progress`, `:learning`, `:profile`, `:preferences`.
- Se guarda: resultados de sesiones (juego, nivel, semilla, puntuación, precisión, duración,
  fecha), progreso del curso, días con práctica, retos diarios, meta semanal y preferencias.
- **No** se pide ni se guarda nombre, email, edad, ubicación ni ningún dato personal. La ruta
  ("Kids", "Seniors"…) es una elección de sugerencias, no un dato de edad, y es opcional.
- Ajustes → "Your data" muestra todo lo guardado en JSON y permite borrarlo con confirmación.
- No se deduce edad, discapacidad ni condición médica del desempeño; ningún texto interpreta
  errores o lentitud como síntoma.

## Menores

La ruta Kids está diseñada sin nombre, sin chat, sin rankings públicos, sin compras y sin
incentivos para compartir información. **Antes de ofrecer la plataforma públicamente a menores**
con cualquier componente de servidor habría que resolver, como mínimo:

- Consentimiento verificable de padres/tutores (COPPA en EE. UU.; art. 8 RGPD y edad de
  consentimiento digital del país en la UE; normativa local aplicable).
- Minimización de datos, base legal, plazos de conservación y derecho de supresión.
- Evaluación de impacto (DPIA) y el código de diseño apropiado para la edad (p. ej. UK Age
  Appropriate Design Code) si aplica.
- Revisión de contenidos y de cualquier mecánica de retención.

## Personas mayores y personas vulnerables

Opciones de texto grande, controles amplios, sin límites de tiempo, menos movimiento e instrucciones
repetibles; mensajes que nunca diagnostican. Las rutas no se asignan automáticamente.
