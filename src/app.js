import express from 'express';
import chatRoutes from './routes/chatRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1/chat', chatRoutes);
  app.use('/api/v1/tickets', ticketRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
