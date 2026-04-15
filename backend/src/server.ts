import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import { env } from './infrastructure/config/env';
import { logger } from './infrastructure/logging/logger';
import { errorHandler } from './presentation/middleware/error-handler';
import { notFoundHandler } from './presentation/middleware/not-found.middleware';
import { apiRouter } from './presentation/routes';
import moduleRoutes from './routes';
import { corsConfig } from './presentation/integration/corsConfig';
import { requestLogger } from './presentation/middleware/request-logger.middleware';

/**
 * Unified HireFlow Server
 * 
 * Architecture Bridge:
 * - Module routes  (/api/v1/*) -> Legacy Prisma-backed logic
 * - Clean-arch API (/api/*)    -> New Clean Architecture & AI logic
 */

export const createServer = (): Express => {
  const app = express();

  // 1. Foundation Middleware
  app.disable('x-powered-by');
  app.use(cors(corsConfig));
  app.use(requestLogger);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 2. ROOT ROUTE (Health & Welcome Dashboard)
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      success: true,
      service: 'HireFlow Unified Backend',
      status: 'UP',
      active_layers: [
        { name: 'Core API', path: '/api/*', architecture: 'Clean Architecture' },
        { name: 'Legacy API', path: '/api/v1/*', architecture: 'Modules (Prisma)' }
      ],
      diagnostics: {
        routes: '/api/routes',
        health: '/api/health'
      }
    });
  });

  // 3. DIAGNOSTICS: Simple Route Discovery
  app.get('/api/routes', (_req: Request, res: Response) => {
    // Simplified, non-recursive summary of main entry points
    // This avoids the "stack of undefined" errors seen in complex scanners
    res.json({
      success: true,
      architecture_layers: {
        clean_architecture: [
          '/api/health',
          '/api/auth/login',
          '/api/candidates',
          '/api/jobs',
          '/api/pipelines',
          '/api/search/candidates',
          '/api/analytics/dashboard'
        ],
        legacy_modules: [
          '/api/v1/candidates',
          '/api/v1/jobs',
          '/api/v1/pipelines',
          '/api/v1/auth/login'
        ]
      },
      message: 'Use these prefixes to hit the respective architecture layers.'
    });
  });

  // 4. MOUNTING
  // Note: Order matters for prefix overlapping
  app.use(moduleRoutes);
  app.use('/api', apiRouter);

  // 5. ERROR HANDLING
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
