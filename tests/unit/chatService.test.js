import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';

const tmp = mkdtempSync(path.join(os.tmpdir(), 'pv-svc-'));
process.env.DATA_FILE = path.join(tmp, 'db.json');
process.env.OPENAI_API_KEY = '';

const { processStudentMessage } = await import('../../src/services/chatService.js');
const { listTickets } = await import('../../src/repositories/ticketRepository.js');

after(() => rmSync(tmp, { recursive: true, force: true }));

const base = { studentName: 'Ana', course: 'Python', channel: 'WhatsApp' };

test('regla de negocio: un reclamo se deriva aunque la IA lo vea como frecuente', async () => {
  // Menciona "fecha de entrega" (el clasificador local lo toma como frecuente) pero es un reclamo.
  const result = await processStudentMessage({ ...base, message: 'Quiero hacer un reclamo sobre la fecha de entrega.' });
  assert.equal(result.derivated, true);
  assert.ok(result.ticketId);
});

test('una prórroga o duda personal también se deriva', async () => {
  for (const message of ['Necesito una prórroga para la clase', 'Tengo un problema personal con la tarea']) {
    assert.equal((await processStudentMessage({ ...base, message })).derivated, true);
  }
});

test('una consulta frecuente no crea ticket', async () => {
  const before = (await listTickets()).length;
  const result = await processStudentMessage({ ...base, message: '¿Dónde está el material de la clase?' });
  assert.equal(result.derivated, false);
  assert.equal((await listTickets()).length, before);
});

test('el ticket conserva el canal elegido por el alumno', async () => {
  const tickets = await listTickets();
  assert.ok(tickets.length > 0);
  assert.ok(tickets.every((t) => t.channel === 'WhatsApp' && t.status === 'PENDING'));
});
