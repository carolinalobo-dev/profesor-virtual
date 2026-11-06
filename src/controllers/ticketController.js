import { getTickets, resolveTicketWithReply } from '../services/ticketService.js';

const STATUSES = ['PENDING', 'RESOLVED'];

export const listTicketsHandler = async (req, res, next) => {
  try {
    const { status } = req.query;
    if (status !== undefined && !STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: 'status debe ser PENDING o RESOLVED.' });
    }
    return res.status(200).json({ success: true, data: await getTickets(status) });
  } catch (error) {
    return next(error);
  }
};

export const resolveTicketHandler = async (req, res, next) => {
  try {
    const ticket = await resolveTicketWithReply(req.params.id, req.body?.teacherReply);
    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    return next(error);
  }
};
