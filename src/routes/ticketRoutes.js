import { Router } from 'express';
import { listTicketsHandler, resolveTicketHandler } from '../controllers/ticketController.js';

const router = Router();

router.get('/', listTicketsHandler);
router.patch('/:id/resolve', resolveTicketHandler);

export default router;
