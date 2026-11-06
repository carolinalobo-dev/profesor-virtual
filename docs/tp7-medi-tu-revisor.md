# Clase 19 — Medí tu revisor

## Tabla de evaluación (dos corridas)
| Archivo | Qué espero que encuentre | Corrida 1 (antes) | Corrida 2 (después) |
|---|---|---|---|
| `src/controllers/chatController.js` | Falta de validación profunda y de manejo de errores robusto | Sí (3/3) | Sí (3/3) |
| `src/repositories/ticketRepository.js` | Persistencia volátil en RAM (array global) con pérdida de datos al reiniciar | No (0/3) | Sí (2/3) |
| `src/services/aiService.js` | Sin timeout ni reintentos ante caídas de OpenAI | No (0/3) | Sí (2/3) |
| `src/routes/chatRoutes.js` | Ninguno (archivo sano) | Sí, calló bien | Sí, calló bien |
| `src/config/dotenv.js` | Ninguno (archivo sano) | Sí, calló bien | Sí, calló bien |

- **Corrida 1:** acertó 3 de 5. **Corrida 2:** acertó 5 de 5.

## Qué cambié y por qué
Una sola línea del prompt: se agregó evaluar *"¿Qué recursos (memoria, I/O, conexiones) se agotan al escalar y existen dependencias de almacenamiento volátil o falta de manejo de reintentos en APIs externas?"*. La primera versión solo buscaba errores obvios e ignoraba problemas arquitectónicos.

## Resultado
El número subió de 3 a 5 de 5. Los casos que cambiaron: la persistencia volátil en `ticketRepository.js` y la falta de resiliencia ante fallos de red en `aiService.js`. Los dos archivos sanos siguieron sin generar falsos positivos.

> Nota: la tabla refleja las corridas del TP original, donde esos archivos tenían los defectos descritos. Esta versión final del repositorio ya los corrige (persistencia en archivo, timeout y reintentos).
