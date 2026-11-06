import OpenAI from 'openai';
import { config } from '../config/env.js';

const SYSTEM_PROMPT = `Sos el Profesor Virtual de una academia online.
Clasificá el mensaje del alumno y respondé SOLO con JSON: {"isFrequent": boolean, "reply": string, "summary": string}.
- isFrequent = true: preguntas frecuentes sobre clases, tareas o fechas de entrega que puedas responder.
- isFrequent = false: reclamos, disconformidad, temas administrativos o personales (prórrogas, notas, pagos).
- reply: respuesta breve y cordial en español. Si isFrequent es false, avisá que un docente va a responder.
- summary: resumen de una línea de la consulta para el docente.
No inventes fechas ni datos que no te hayan dado.`;

let client;
const getClient = () => {
  client ??= new OpenAI({ apiKey: config.openaiApiKey, timeout: config.openaiTimeoutMs, maxRetries: 0 });
  return client;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseEvaluation(text) {
  const parsed = JSON.parse(text);
  if (typeof parsed.isFrequent !== 'boolean' || typeof parsed.reply !== 'string') {
    throw new Error('Respuesta de IA con formato inválido.');
  }
  return {
    isFrequent: parsed.isFrequent,
    reply: parsed.reply,
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
  };
}

// Respaldo local cuando no hay API key o OpenAI no responde.
function localFallback(message) {
  const frequent = /(fecha|entrega|clase|horario|tp\s?\d*|tarea|campus|material)/i.test(message);
  return frequent
    ? { isFrequent: true, reply: 'Consultá la fecha de entrega y el material en el campus virtual de tu curso.', summary: message.slice(0, 120) }
    : { isFrequent: false, reply: 'Tu consulta fue derivada a un docente, que te responderá a la brevedad.', summary: message.slice(0, 120) };
}

export async function askOpenAI(message, course) {
  if (!config.openaiApiKey) return localFallback(message);

  let lastError;
  for (let attempt = 0; attempt <= config.openaiMaxRetries; attempt += 1) {
    try {
      const completion = await getClient().chat.completions.create({
        model: config.openaiModel,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Curso: ${course}\nMensaje: ${message}` },
        ],
      });
      return parseEvaluation(completion.choices[0].message.content);
    } catch (error) {
      lastError = error;
      await sleep(300 * 2 ** attempt);
    }
  }
  console.error('OpenAI no disponible, se usa clasificación local:', lastError?.message);
  // Ante la caída de la IA, derivar a un humano es el comportamiento seguro.
  return { ...localFallback(message), isFrequent: false };
}
