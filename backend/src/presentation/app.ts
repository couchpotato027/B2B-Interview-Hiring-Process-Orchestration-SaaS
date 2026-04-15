import cors from 'cors';
import express from 'express';
import authRoutes from '../modules/auth/auth.routes';
import { env } from '../infrastructure/config/env';
import { logger } from '../infrastructure/logging/logger';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found.middleware';
import { apiRouter } from './routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use((req, _res, next) => {
    logger.info({ method: req.method, path: req.path }, 'Incoming request');
    next();
  });
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  
  // ── Documentation ─────────────────────────────────────────────────────────
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api', apiRouter);
  app.use('/api/v1/auth', authRoutes);
  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
};
