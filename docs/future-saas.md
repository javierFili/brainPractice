# Evolución hacia SaaS

La demo ya separa lo necesario para crecer sin reescribir:

| Pieza                    | Hoy                                                        | Mañana                                                                             |
| ------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Persistencia             | `Repository<T>` (get/save/clear, async) sobre localStorage | Adaptador HTTP con la misma interfaz; sincronización y migración del local al alta |
| Evaluación de respuestas | Dominio puro; `question` y `solution` separados            | Evaluar en servidor sin enviar la solución al cliente (anti-trampa en assessments) |
| Generación               | Determinista por (juego, nivel, semilla)                   | Retos diarios y assessments firmados por el servidor                               |
| Perfiles / rutas         | Datos estáticos (`content/paths.ts`)                       | Configurables por organización (colegios, residencias)                             |
| Preferencias             | Slice local                                                | Por cuenta, sincronizadas                                                          |
| Recomendaciones          | Reglas deterministas explicadas                            | Mismas reglas + parámetros por usuario; nada opaco                                 |

## Pendiente antes de lanzar

1. Cuentas y autenticación; cuentas de tutor para menores (ver [privacy.md](privacy.md)).
2. API + base de datos; migración del progreso local.
3. Internacionalización (la UI está en inglés; extraer textos, empezar por español).
4. Tema claro y alto contraste.
5. Auditoría externa de accesibilidad y pruebas con usuarios de cada ruta.
6. Revisión legal del copy (sin afirmaciones de salud) y de la publicidad del producto.
7. Pagos (deliberadamente fuera de esta fase).
8. Observabilidad y reporte de errores respetuoso con la privacidad.
