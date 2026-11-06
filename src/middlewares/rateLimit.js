import { config } from '../config/env.js';

// Límite por IP en memoria: protege el gasto de OpenAI ante abuso.
// En un despliegue con varias instancias conviene moverlo a un almacén compartido.
const hits = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) if (entry.resetAt <= now) hits.delete(ip);
}, config.rateLimitWindowMs).unref();

export function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip;
  let entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + config.rateLimitWindowMs };
    hits.set(key, entry);
  }
  entry.count += 1;

  if (entry.count > config.rateLimitMax) {
    res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
    return res.status(429).json({ success: false, error: 'Demasiadas consultas. Esperá un momento e intentá de nuevo.' });
  }
  return next();
}
