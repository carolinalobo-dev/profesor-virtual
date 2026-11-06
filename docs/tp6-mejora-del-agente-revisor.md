# Clase 17 — Mejorá el agente revisor

El archivo mejorado está en [`agents/revisor.md`](../agents/revisor.md) (mantiene `readonly: true`).

## Cambios y justificación
1. **Rol y alcance precisos** ("auditor de seguridad senior… analizá únicamente las modificaciones"): evita analizar código legacy no modificado y reduce falsos positivos.
2. **Formato obligatorio de hallazgos** (`[GRAVEDAD] - Título | Archivo:Línea | Escenario | Acción`): la versión original devolvía párrafos inconsistentes; ahora se prioriza en segundos.
3. **Preguntas explícitas de sanitización y manejo de errores**: detecta `try/catch` faltantes e inyección SQL/XSS en lugar de una pregunta vaga sobre "fallas".
4. **Respuesta determinista ante código limpio**: evita sugerencias inventadas por complacencia.

## Evidencia (antes vs. después sobre `queryTicketRows`)
| Revisor original | Revisor mejorado |
|---|---|
| Respuesta narrativa que mezcla estilo con seguridad: menciona `sqlcmd`, `SELECT *`, el búfer y `DB_SERVER` sin orden ni ubicación. | 1. **[Alta]** CLI externo sin aislamiento · `queryTicketRows:12` → migrar a `mssql`. 2. **[Media]** Desbordamiento de búfer · `:19` → streaming o paginación. 3. **[Media]** `SELECT *` · `:21` → proyectar columnas. |
