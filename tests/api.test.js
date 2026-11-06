import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, jsonRequest, student } from './helpers.js';

let app;
before(async () => { app = await startServer(); });
after(() => app.close());

const chat = (body) => jsonRequest('POST', `${app.base}/chat/message`, body);

test('rechaza mensajes sin identidad del alumno', async () => {
  const res = await chat({ message: 'Hola' });
  assert.equal(res.status, 400);
});

test('rechaza un canal desconocido', async () => {
  const res = await chat({ ...student, channel: 'Telegram', message: 'Hola' });
  assert.equal(res.status, 400);
});

test('rechaza JSON mal formado con 400', async () => {
  const res = await fetch(`${app.base}/chat/message`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{no es json',
  });
  assert.equal(res.status, 400);
});

test('consulta frecuente: responde sin crear ticket', async () => {
  const body = await (await chat({ ...student, message: '¿Cuándo es la fecha de entrega del TP3?' })).json();
  assert.equal(body.data.derivated, false);
  assert.equal(body.data.ticketId, null);
});

test('reclamo: se deriva y crea ticket PENDING', async () => {
  const body = await (await chat({ ...student, message: 'Tengo un reclamo: no estoy conforme con mi nota.' })).json();
  assert.equal(body.data.derivated, true);
  assert.ok(body.data.ticketId);

  const list = await (await fetch(`${app.base}/tickets?status=PENDING`)).json();
  assert.equal(list.data.length, 1);
});

test('el filtro de tickets rechaza estados inválidos', async () => {
  const res = await fetch(`${app.base}/tickets?status=BORRADO`);
  assert.equal(res.status, 400);
});

test('un ticket no se cierra sin respuesta del docente', async () => {
  const { data: [ticket] } = await (await fetch(`${app.base}/tickets?status=PENDING`)).json();
  const url = `${app.base}/tickets/${ticket.id}/resolve`;

  assert.equal((await jsonRequest('PATCH', url, {})).status, 400);
  assert.equal((await jsonRequest('PATCH', url, { teacherReply: '   ' })).status, 400);
  assert.equal((await jsonRequest('PATCH', url, { teacherReply: 'x'.repeat(2001) })).status, 400);

  const ok = await jsonRequest('PATCH', url, { teacherReply: 'Revisamos tu nota y la corregimos.' });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).data.status, 'RESOLVED');
});

test('cerrar un ticket ya resuelto devuelve 409 y uno inexistente 404', async () => {
  const { data: [ticket] } = await (await fetch(`${app.base}/tickets?status=RESOLVED`)).json();
  const again = await jsonRequest('PATCH', `${app.base}/tickets/${ticket.id}/resolve`, { teacherReply: 'Otra vez' });
  assert.equal(again.status, 409);

  const missing = await jsonRequest('PATCH', `${app.base}/tickets/no-existe/resolve`, { teacherReply: 'Hola' });
  assert.equal(missing.status, 404);
});

test('analytics resume automatización vs derivación', async () => {
  const { data } = await (await fetch(`${app.base}/analytics/summary`)).json();
  assert.equal(data.totalInteractions, 2);
  assert.equal(data.resolvedByAIPercent, 50);
  assert.equal(data.derivatedPercent, 50);
});

test('la interfaz web se sirve con cabeceras de seguridad', async () => {
  const res = await fetch(app.root);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Profesor Virtual/);
  assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-powered-by'), null);
});

test('rutas desconocidas devuelven 404 JSON', async () => {
  const res = await fetch(`${app.base}/nada`);
  assert.equal(res.status, 404);
  assert.equal((await res.json()).success, false);
});
