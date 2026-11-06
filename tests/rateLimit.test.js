import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, jsonRequest, student } from './helpers.js';

let app;
before(async () => { app = await startServer({ RATE_LIMIT_MAX: '3' }); });
after(() => app.close());

test('el chat limita las consultas por IP con 429 y Retry-After', async () => {
  const send = () => jsonRequest('POST', `${app.base}/chat/message`, { ...student, message: '¿Cuándo es la clase?' });

  for (let i = 0; i < 3; i += 1) assert.equal((await send()).status, 200);

  const blocked = await send();
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
});

test('el límite no afecta a los demás endpoints', async () => {
  assert.equal((await fetch(`${app.base}/tickets`)).status, 200);
});
