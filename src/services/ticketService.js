import { findTicketById, listTickets, resolveTicket } from '../repositories/ticketRepository.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const getTickets = (status) => listTickets(status);

// Regla de negocio: un ticket derivado no se cierra sin respuesta explícita del docente.
export async function resolveTicketWithReply(id, teacherReply) {
  if (typeof teacherReply !== 'string' || teacherReply.trim().length === 0) {
    throw new HttpError(400, 'Se requiere la respuesta del docente para cerrar el ticket.');
  }
  const ticket = await findTicketById(id);
  if (!ticket) throw new HttpError(404, 'Ticket no encontrado.');
  if (ticket.status === 'RESOLVED') throw new HttpError(409, 'El ticket ya fue resuelto.');
  return resolveTicket(id, teacherReply.trim());
}
