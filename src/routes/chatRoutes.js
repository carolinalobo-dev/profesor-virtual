import { Router } from 'express';
import { handleChatMessage } from '../controllers/chatController.js';
import { validateChatMessage } from '../middlewares/validateChatMessage.js';

const router = Router();

router.post('/message', validateChatMessage, handleChatMessage);

export default router;
