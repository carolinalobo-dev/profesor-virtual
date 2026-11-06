import { fileURLToPath } from 'node:url';
import express from 'express';
import chatRoutes from './routes/chatRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { rateLimit } from './middlewares/rateLimit.js';
import { requireTeacher } from './middlewares/requireTeacher.js';
import { securityHeaders } from './middlewares/securityHeaders.js';

const publicDir = fileURLToPath(new URL('../public', import.meta.url));

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(express.json({ limit: '10kb' }));
  app.use(express.static(publicDir));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1/chat', rateLimit, chatRoutes);
  app.use('/api/v1/tickets', requireTeacher, ticketRoutes);
  app.use('/api/v1/analytics', requireTeacher, analyticsRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
