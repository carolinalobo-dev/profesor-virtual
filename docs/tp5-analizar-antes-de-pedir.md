# TP N° 5 — Analizar antes de pedir

Auditoría de la función `queryTicketRows` (Node.js / SQL Server) antes de pedirle un cambio a la IA.

## Tres problemas detectados (de mayor a menor gravedad)
1. **Alta — Dependencia de un ejecutable del SO (`sqlcmd`).** Al containerizar (Node Alpine) o desplegar en Render/Railway/EC2, `sqlcmd` no existe y cada `GET /tickets` falla con `ENOENT`.
2. **Media — Búfer acotado (`maxBuffer` de 10 MB).** Con ~15.000 tickets el `stdout` supera el tope y Node lanza `ERR_CHILD_PROCESS_STDIO_MAX_BUFFER`, abortando la petición.
3. **Menor — `SELECT *`.** Al agregar columnas pesadas (auditoría, adjuntos) se transportan bytes que el listado no necesita, aumentando latencia y ancho de banda.

## Prompt diseñado
> Refactoriza la función `queryTicketRows` en TypeScript para eliminar por completo la dependencia del comando CLI externo `sqlcmd` (`child_process.execFile`). En su lugar, implementa la consulta utilizando un driver oficial para Node.js (como el paquete `mssql`), gestionando correctamente el pool de conexiones y las variables de entorno. Restricciones: 1. Mantén exactamente la firma `async function queryTicketRows(): Promise<unknown[]>`. 2. No agregues paginación ni filtros. 3. Reemplaza el `SELECT *` por una proyección explícita (id, title, status, createdAt). 4. No modifiques la validación inicial de `DB_SERVER` y `DB_DATABASE`.

## Justificación
- **Contexto dado**: lenguaje, falla a erradicar y firma a respetar → reemplazo directo (*drop-in*) que no rompe a los controladores.
- **Límites**: se prohibió agregar paginación o filtros para evitar sobrediseño en un cambio puntual.
- **Decisiones mías, no de la IA**: qué driver usar (`mssql`), qué columnas proyectar y mantener el cambio acotado.
