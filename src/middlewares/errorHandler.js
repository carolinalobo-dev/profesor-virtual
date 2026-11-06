export function notFound(_req, res) {
  res.status(404).json({ success: false, error: 'Ruta no encontrada.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'JSON inválido.' });
  }
  if (error.status && error.status < 500) {
    return res.status(error.status).json({ success: false, error: error.message });
  }
  console.error(error);
  return res.status(500).json({ success: false, error: 'Error interno del servidor.' });
}
