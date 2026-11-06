# Profesor Virtual — Generación T (Módulo 3)

Backend en Node.js + Express para una academia online. Un modelo de IA (OpenAI) responde las preguntas frecuentes de los alumnos y deriva con un ticket a un docente las consultas complejas, administrativas o personales.

Arquitectura en capas **Controller → Service → Repository**.

```
src/
  controllers/   HTTP y respuestas JSON
  services/      reglas de negocio, IA (aiService), webhooks
  repositories/  persistencia (archivo JSON, reemplazable)
  middlewares/   validación/sanitización y errores
  routes/
agents/revisor.md   subagente revisor de código (readonly)
docs/               entregas de los trabajos prácticos
tests/              pruebas con node:test
```

## Uso
```bash
npm install
cp .env.example .env   # opcional: completar OPENAI_API_KEY
npm start
npm test
```
Sin `OPENAI_API_KEY` se usa un clasificador local de respaldo. Si OpenAI falla (timeout/reintentos agotados), la consulta se deriva a un docente.

## Endpoints
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/v1/chat/message` | `{ studentName, course, message, channel }` → respuesta o ticket |
| GET | `/api/v1/tickets?status=PENDING` | Lista tickets |
| PATCH | `/api/v1/tickets/:id/resolve` | `{ teacherReply }` cierra el ticket |
| GET | `/api/v1/analytics/summary` | % resuelto por IA vs. derivado |

## Reglas de negocio
- Reclamos, disconformidad o dudas personales siempre generan ticket (`isFrequent = false`).
- Un ticket no puede cerrarse sin respuesta explícita del docente.
- Se exige nombre y curso antes de procesar con IA.

## Trabajos prácticos
- [TP 4 — Backend Profesor Virtual](docs/tp4-backend-profesor-virtual.md)
- [TP 5 — Analizar antes de pedir](docs/tp5-analizar-antes-de-pedir.md)
- [Clase 17 — Mejorá el agente](docs/tp6-mejora-del-agente-revisor.md)
- [Clase 19 — Medí tu revisor](docs/tp7-medi-tu-revisor.md)

Autora: Carolina Lobo.
