import { Router } from 'express';
import { summaryHandler } from '../controllers/analyticsController.js';

const router = Router();

router.get('/summary', summaryHandler);

export default router;
