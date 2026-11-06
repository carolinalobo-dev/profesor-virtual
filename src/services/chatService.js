import { askOpenAI } from './aiService.js';
import { notifyTicketCreated } from './webhookService.js';
import { createTicket, saveInteraction } from '../repositories/ticketRepository.js';

// Regla de negocio: reclamos, disconformidad o dudas personales siempre se derivan,
// aunque la IA los haya clasificado como frecuentes.
const MUST_DERIVE = /(reclamo|disconforme|no estoy conforme|queja|injust|problema personal|pr[oó]rroga|me siento|salud|nota incorrecta)/i;

export const processStudentMessage = async ({ studentName, course, message, channel }) => {
  const aiEvaluation = await askOpenAI(message, course);
  const isFrequent = aiEvaluation.isFrequent && !MUST_DERIVE.test(message);

  let ticketId = null;
  if (!isFrequent) {
    const ticket = await createTicket({
      studentName,
      course,
      originalMessage: message,
      summary: aiEvaluation.summary,
      channel: channel || 'WebChat',
    });
    ticketId = ticket.id;
    notifyTicketCreated(ticket);
  }

  await saveInteraction({
    studentName,
    course,
    message,
    response: aiEvaluation.reply,
    isFrequent,
    derivated: !isFrequent,
    ticketId,
  });

  return { reply: aiEvaluation.reply, derivated: !isFrequent, ticketId };
};
