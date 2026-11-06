import { createApp } from './app.js';
import { config } from './config/env.js';

createApp().listen(config.port, () => {
  console.log(`Profesor Virtual escuchando en http://localhost:${config.port}`);
});
