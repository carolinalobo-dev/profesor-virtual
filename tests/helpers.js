import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';

// Cada archivo de test corre en su propio proceso, por eso puede fijar el entorno
// antes de importar la app (la configuración se lee una sola vez al importar).
export async function startServer(env = {}) {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'pv-'));
  Object.assign(process.env, {
    DATA_FILE: path.join(tmp, 'db.json'),
    OPENAI_API_KEY: '',
    TEACHER_API_KEY: '',
    RATE_LIMIT_MAX: '1000',
    ...env,
  });

  const { createApp } = await import('../src/app.js');
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  return {
    root: `http://127.0.0.1:${server.address().port}`,
    base: `http://127.0.0.1:${server.address().port}/api/v1`,
    close() {
      server.close();
      rmSync(tmp, { recursive: true, force: true });
    },
  };
}

export const jsonRequest = (method, url, body, headers = {}) =>
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const student = { studentName: 'Carolina Lobo', course: 'Desarrollo Web', channel: 'WebChat' };
