import { createApp } from './app.js';
import { config } from './config/env.js';

if (!config.teacherApiKey) {
  console.warn('Aviso: TEACHER_API_KEY no está definida; el panel docente queda abierto. Definila antes de publicar.');
}

createApp().listen(config.port, () => {
  console.log(`Profesor Virtual escuchando en http://localhost:${config.port}`);
});
