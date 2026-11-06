import { timingSafeEqual } from 'node:crypto';
import { config } from '../config/env.js';

// Protege los endpoints del docente. Si TEACHER_API_KEY no está definida,
// el acceso queda abierto (solo para desarrollo local; server.js lo advierte).
export function requireTeacher(req, res, next) {
  if (!config.teacherApiKey) return next();

  const provided = Buffer.from(req.get('x-api-key') ?? '');
  const expected = Buffer.from(config.teacherApiKey);
  if (provided.length === expected.length && timingSafeEqual(provided, expected)) return next();

  return res.status(401).json({ success: false, error: 'Se requiere la clave del docente.' });
}
