import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, jsonRequest, student } from './helpers.js';

let app;
before(async () => { app = await startServer({ TEACHER_API_KEY: 'clave-de-prueba' }); });
after(() => app.close());

test('el panel docente exige la clave', async () => {
  assert.equal((await fetch(`${app.base}/tickets`)).status, 401);
  assert.equal((await fetch(`${app.base}/analytics/summary`)).status, 401);
  assert.equal((await fetch(`${app.base}/tickets`, { headers: { 'x-api-key': 'otra' } })).status, 401);
  assert.equal((await jsonRequest('PATCH', `${app.base}/tickets/x/resolve`, { teacherReply: 'Hola' })).status, 401);
});

test('con la clave correcta se accede al panel', async () => {
  const headers = { 'x-api-key': 'clave-de-prueba' };
  assert.equal((await fetch(`${app.base}/tickets`, { headers })).status, 200);
  assert.equal((await fetch(`${app.base}/analytics/summary`, { headers })).status, 200);
});

test('el chat del alumno sigue siendo público', async () => {
  const res = await jsonRequest('POST', `${app.base}/chat/message`, { ...student, message: '¿A qué hora es la clase?' });
  assert.equal(res.status, 200);
});
