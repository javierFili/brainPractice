# Product

## Visión

Una plataforma donde una persona **aprende a programar desde la lógica** y **entrena las capacidades
cognitivas que leer y escribir código exige**, viendo su progreso real. La prueba de éxito:

> "Esto realmente me está ayudando a pensar y programar mejor" → "Quiero seguir usando esto."

```text
              PLATFORM
                  │
       ┌──────────┼──────────┐
       ↓          ↓          ↓
     LEARN      TRAIN      ASSESS
  10 lecciones  5 juegos   perfil en 5 áreas
  interactivas  × 10 niv.  con márgenes honestos
       └──────────┼──────────┘
                  ↓
        "Your Mind" dashboard + recomendaciones explicadas + hábito diario
```

## Recorrido del usuario

```text
Landing ──▶ "Start with a 2-minute challenge" (/start)
   │            3 problemas de lógica → resultado explicado → elegir objetivo + días por semana
   │                                                            │
   └─ "Go straight to the lessons" (/learn)                     ▼
                                          Learn: lección 1 → ejercicios → éxito → resumen
                                          (mastery, siguiente lección, entrenamiento relacionado)
                                                            │
                                                            ▼
                                Dashboard ("Your Mind"): Today = repaso vencido → siguiente lección
                                → daily challenge → entrenamiento ligado al concepto actual
```

Sin cuenta ni registro: todo vive en el navegador (`localStorage`, tres slices versionados). Si el
navegador bloquea el almacenamiento, la app funciona en memoria y lo avisa.

## Retención basada en valor (y lo que no hacemos)

| Mecanismo         | Por qué vuelve el usuario                                                    |
| ----------------- | ---------------------------------------------------------------------------- |
| Siguiente lección | Hay algo nuevo que aprender, y el resumen dice qué se abre.                  |
| Repaso espaciado  | Lo aprendido vuelve justo cuando empieza a olvidarse (1, 3, 7, 14, 30 días). |
| Daily challenge   | 5 problemas, 3 minutos, el mismo para todos ese día, a su nivel.             |
| Objetivo semanal  | Días por semana elegidos por el usuario; el dashboard muestra la semana.     |
| Recomendaciones   | Siempre con el porqué, en términos de su propio progreso.                    |
| Progreso visible  | % del curso, conceptos dominados, nivel por área, perfil de rendimiento.     |

**No usamos**: falsas urgencias, rachas que castigan ("¡vas a perder tu racha!"), notificaciones,
spam, bloqueo artificial de funciones esenciales ni recompensas sin progreso real detrás. La racha se
muestra pero no se amenaza; perder un día no cuesta nada.

## Honestidad sobre lo que se mide

- Las puntuaciones describen el rendimiento **en estos ejercicios**. No son IQ, ni diagnóstico, ni
  medida de inteligencia; no se comparan con normas poblacionales.
- Lenguaje permitido: "Train your cognitive skills", "Practice working memory", "Track your
  performance". Prohibido: "aumenta tu IQ", "serás más inteligente en 30 días".
- El assessment muestra su margen (±40 por área con 6 ítems) y pide leerlo como orientación.
- Las conexiones Learn ↔ Train se presentan como práctica relacionada, no como causalidad.

## Free vs Premium (diseño, sin pagos implementados)

Primero demostrar valor; no bloquear lo esencial durante el MVP.

| Free (siempre)                               | Premium (hipótesis)                                               |
| -------------------------------------------- | ----------------------------------------------------------------- |
| Los 5 juegos, niveles 1–10                   | Módulos 2+ del learning path                                      |
| Module 1 de Programming Logic (10 lecciones) | Entrenamiento adaptativo y plan personal                          |
| Daily challenge, repasos básicos             | Analítica detallada por concepto y habilidad, evolución histórica |
| Progreso y dashboard                         | Retos de debugging y algoritmos avanzados                         |
| Assessment                                   | Sincronización entre dispositivos (requiere cuentas)              |

Preparación técnica existente: registro de juegos y cursos como datos (fácil marcar contenido por
plan), puertos `Repository<T>` (un `ApiRepository` no cambia el dominio), slices versionados con
migraciones. Falta: identidad, feature flags por plan, analítica de producto.

## Métricas de producto a instrumentar (futuro)

Activación (primera lección superada en la primera visita), retención D1/D7, lecciones superadas por
usuario activo, repasos completados a tiempo, días activos/semana frente al objetivo elegido.

Más contexto: [docs/product-value.md](docs/product-value.md) (test "I would pay for this") y
[docs/product-audit.md](docs/product-audit.md).
