import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';

const tmp = mkdtempSync(path.join(os.tmpdir(), 'pv-repo-'));
process.env.DATA_FILE = path.join(tmp, 'db.json');

const repo = await import('../../src/repositories/ticketRepository.js');

after(() => rmSync(tmp, { recursive: true, force: true }));

const draft = (n) => ({ studentName: `Alumno ${n}`, course: 'Python', originalMessage: 'x', summary: 'x', channel: 'WebChat' });

test('escrituras simultáneas no pierden datos', async () => {
  await Promise.all(Array.from({ length: 25 }, (_, i) => repo.createTicket(draft(i))));
  assert.equal((await repo.listTickets()).length, 25);
});

test('dos cierres simultáneos del mismo ticket: solo uno gana', async () => {
  const ticket = await repo.createTicket(draft('carrera'));
  const results = await Promise.all([
    repo.resolveTicket(ticket.id, 'Respuesta A'),
    repo.resolveTicket(ticket.id, 'Respuesta B'),
  ]);
  const outcomes = results.map((r) => r.outcome).sort();
  assert.deepEqual(outcomes, ['already_resolved', 'resolved']);
});

test('sin archivo previo, el repositorio arranca vacío', async () => {
  assert.deepEqual(await repo.countInteractions(), { total: 0, derivated: 0 });
});
