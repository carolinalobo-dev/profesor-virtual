import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';

const tmp = mkdtempSync(path.join(os.tmpdir(), 'pv-'));
process.env.DATA_FILE = path.join(tmp, 'db.json');
process.env.OPENAI_API_KEY = '';

const { createApp } = await import('../src/app.js');

let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(() => {
  server.close();
  rmSync(tmp, { recursive: true, force: true });
});

const post = (url, body) =>
  fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const alumno = { studentName: 'Carolina Lobo', course: 'Desarrollo Web', channel: 'WebChat' };

test('rechaza mensajes sin identidad del alumno', async () => {
  const res = await post('/chat/message', { message: 'Hola' });
  assert.equal(res.status, 400);
});

test('consulta frecuente: responde sin crear ticket', async () => {
  const res = await post('/chat/message', { ...alumno, message: '¿Cuándo es la fecha de entrega del TP3?' });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.data.derivated, false);
  assert.equal(body.data.ticketId, null);
});

test('reclamo: se deriva y crea ticket PENDING', async () => {
  const res = await post('/chat/message', { ...alumno, message: 'Tengo un reclamo: no estoy conforme con mi nota.' });
  const body = await res.json();
  assert.equal(body.data.derivated, true);
  assert.ok(body.data.ticketId);

  const list = await (await fetch(`${base}/tickets?status=PENDING`)).json();
  assert.equal(list.data.length, 1);
});

test('un ticket no se cierra sin respuesta del docente', async () => {
  const { data: [ticket] } = await (await fetch(`${base}/tickets?status=PENDING`)).json();
  const sinRespuesta = await fetch(`${base}/tickets/${ticket.id}/resolve`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}',
  });
  assert.equal(sinRespuesta.status, 400);

  const conRespuesta = await fetch(`${base}/tickets/${ticket.id}/resolve`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teacherReply: 'Revisamos tu nota y la corregimos.' }),
  });
  assert.equal(conRespuesta.status, 200);
  assert.equal((await conRespuesta.json()).data.status, 'RESOLVED');
});

test('analytics resume automatización vs derivación', async () => {
  const { data } = await (await fetch(`${base}/analytics/summary`)).json();
  assert.equal(data.totalInteractions, 2);
  assert.equal(data.resolvedByAIPercent, 50);
});
