import { listTickets, resolveTicket } from '../repositories/ticketRepository.js';

const MAX_REPLY_LENGTH = 2000;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const getTickets = (status) => listTickets(status);

// Regla de negocio: un ticket derivado no se cierra sin respuesta explícita del docente.
export async function resolveTicketWithReply(id, teacherReply) {
  const reply = typeof teacherReply === 'string' ? teacherReply.trim() : '';
  if (reply.length === 0) {
    throw new HttpError(400, 'Se requiere la respuesta del docente para cerrar el ticket.');
  }
  if (reply.length > MAX_REPLY_LENGTH) {
    throw new HttpError(400, `La respuesta no puede superar los ${MAX_REPLY_LENGTH} caracteres.`);
  }

  const result = await resolveTicket(id, reply);
  if (result.outcome === 'not_found') throw new HttpError(404, 'Ticket no encontrado.');
  if (result.outcome === 'already_resolved') throw new HttpError(409, 'El ticket ya fue resuelto.');
  return result.ticket;
}
