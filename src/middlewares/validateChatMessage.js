const CHANNELS = ['WebChat', 'WhatsApp'];
const MAX_MESSAGE_LENGTH = 1000;
const MAX_NAME_LENGTH = 100;

const clean = (value) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim() : '';

// Valida y sanitiza el body antes de llegar al controlador.
// Regla de negocio: se exige identidad (nombre y curso) antes de invocar a la IA.
export function validateChatMessage(req, res, next) {
  const studentName = clean(req.body?.studentName);
  const course = clean(req.body?.course);
  const message = clean(req.body?.message);
  const channel = req.body?.channel ?? 'WebChat';

  const errors = [];
  if (!studentName || studentName.length > MAX_NAME_LENGTH) errors.push('studentName es obligatorio (máx. 100 caracteres).');
  if (!course || course.length > MAX_NAME_LENGTH) errors.push('course es obligatorio (máx. 100 caracteres).');
  if (!message || message.length > MAX_MESSAGE_LENGTH) errors.push('message es obligatorio (máx. 1000 caracteres).');
  if (!CHANNELS.includes(channel)) errors.push('channel debe ser WebChat o WhatsApp.');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors.join(' ') });
  }

  req.body = { studentName, course, message, channel };
  return next();
}
