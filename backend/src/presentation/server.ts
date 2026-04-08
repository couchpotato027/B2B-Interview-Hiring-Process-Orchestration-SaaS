import cors from 'cors';
import express from 'express';
import authRoutes from '../modules/auth/auth.routes';
import { env } from '../infrastructure/config/env';
import { logger } from '../infrastructure/logging/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/not-found.middleware';
import { apiRouter } from './routes';

export const createServer = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use((req, _res, next) => {
    logger.info({ method: req.method, path: req.path }, 'Incoming request');
    next();
  });
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiRouter);
  app.use('/api/v1/auth', authRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
