import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config/env.js';

// Capa de datos: persiste en un archivo JSON para sobrevivir reinicios.
// Cambiar a una base de datos real solo requiere reemplazar este módulo.

let writeQueue = Promise.resolve();

const emptyDb = () => ({ tickets: [], interactions: [] });

const filePath = () => path.resolve(config.dataFile);

async function readDb() {
  try {
    const raw = await fs.readFile(filePath(), 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return emptyDb();
    throw error;
  }
}

// Serializa las escrituras y reemplaza el archivo de forma atómica.
function mutate(mutator) {
  const run = writeQueue.then(async () => {
    const db = await readDb();
    const result = mutator(db);
    const target = filePath();
    await fs.mkdir(path.dirname(target), { recursive: true });
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, target);
    return result;
  });
  writeQueue = run.catch(() => {});
  return run;
}

export async function createTicket({ studentName, course, originalMessage, summary, channel }) {
  const ticket = {
    id: randomUUID(),
    studentName,
    course,
    originalMessage,
    summary,
    channel,
    status: 'PENDING',
    teacherReply: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };
  await mutate((db) => db.tickets.push(ticket));
  return ticket;
}

export async function saveInteraction(interaction) {
  const record = { id: randomUUID(), timestamp: new Date().toISOString(), ...interaction };
  await mutate((db) => db.interactions.push(record));
  return record;
}

export async function listTickets(status) {
  const { tickets } = await readDb();
  return status ? tickets.filter((t) => t.status === status) : tickets;
}

export async function findTicketById(id) {
  const { tickets } = await readDb();
  return tickets.find((t) => t.id === id) ?? null;
}

export async function resolveTicket(id, teacherReply) {
  return mutate((db) => {
    const ticket = db.tickets.find((t) => t.id === id);
    if (!ticket) return null;
    ticket.status = 'RESOLVED';
    ticket.teacherReply = teacherReply;
    ticket.resolvedAt = new Date().toISOString();
    return ticket;
  });
}

export async function countInteractions() {
  const { interactions } = await readDb();
  const derivated = interactions.filter((i) => i.derivated).length;
  return { total: interactions.length, derivated };
}
