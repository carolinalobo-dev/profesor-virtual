# TP N° 4 — Diseñando la arquitectura backend: Profesor Virtual

## Descripción
Plataforma de asistencia virtual para estudiantes de una academia online. Un modelo de IA responde preguntas frecuentes sobre clases, tareas y fechas de entrega, y deriva mediante un ticket a un docente humano las consultas complejas, administrativas o personales.

## Entidades
- **Student**: id, name, email, course, enrolledAt.
- **Message**: id, studentId, content, channel (WebChat/WhatsApp), timestamp.
- **QueryLog**: id, messageId, aiReply, isFrequent, status.
- **Ticket**: id, studentId, messageId, summary, status (PENDING, RESOLVED), createdAt.

## Reglas de negocio
1. Reclamos, disconformidad o dudas personales → `isFrequent = false` y ticket obligatorio (`chatService.js`).
2. Un ticket derivado no se cierra sin respuesta explícita de un docente (`ticketService.js`).
3. Se valida la identidad (nombre y curso) antes de llamar a la IA (`validateChatMessage.js`).

## Frontend vs. Backend
| Frontend | Backend |
|---|---|
| Chat, formularios, indicadores de carga, aviso de ticket creado, bandeja de tickets del docente | Sanitización y validación, integración con OpenAI y prompt engineering, reglas de clasificación/derivación, persistencia, webhooks (Make/Zapier) |

## Endpoints
| Método | Endpoint | Propósito |
|---|---|---|
| POST | `/api/v1/chat/message` | Procesa la consulta con IA y responde o crea ticket |
| GET | `/api/v1/tickets` | Lista tickets (filtro opcional `?status=PENDING\|RESOLVED`) |
| PATCH | `/api/v1/tickets/:id/resolve` | El docente responde y cierra el ticket (`{ "teacherReply": "..." }`) |
| GET | `/api/v1/analytics/summary` | % resuelto por IA vs. derivado a docente |

## Arquitectura: Controller – Service – Repository
- **Controller**: recibe HTTP y devuelve JSON estandarizado.
- **Service**: reglas de negocio y orquestación de OpenAI.
- **Repository**: aísla el almacenamiento; se puede cambiar la tecnología sin tocar las reglas.

## Decisión de la IA que cuestioné
La IA propuso llamar a OpenAI e insertar registros directamente en las rutas de Express (`chatRoutes.js`), guardando los tickets en un array global en memoria. Lo rechacé: viola la responsabilidad única, es difícil de mantener y pierde los datos al reiniciar. Se separó la IA en `aiService.js`, la lógica en `chatService.js` y los datos en `ticketRepository.js`, con persistencia en archivo.

## Evidencia
Ver `tests/api.test.js` (`npm test`): consulta frecuente sin ticket, reclamo derivado con ticket, rechazo de cierre sin respuesta docente y métricas.

```http
POST /api/v1/chat/message
{ "studentName": "Carolina Lobo", "course": "Desarrollo Web",
  "message": "¿Cuándo es la fecha límite para entregar el TP3?", "channel": "WebChat" }
→ 200 { "success": true, "data": { "reply": "...", "derivated": false, "ticketId": null } }
```
