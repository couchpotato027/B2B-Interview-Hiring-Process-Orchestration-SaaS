/**
 * HireFlow Backend — Entry Point
 *
 * Boot order:
 *  1. Load + validate environment config
 *  2. Set up the DI container (registers all use-cases, repos, services)
 *  3. Start the SLA background worker (BullMQ + Redis)
 *  4. Create and start the unified Express server
 *  5. Register graceful-shutdown handlers
 */

import { AppConfig }     from './infrastructure/config/AppConfig';
import { env }           from './infrastructure/config/env';
import { setupContainer }from './infrastructure/di/setupContainer';
import { logger }        from './infrastructure/logging/logger';
import { createServer }  from './presentation/server';
import { wsService }     from './presentation/integration/websocket';

// Import the SLA worker so it registers itself against the BullMQ queue.
import './infrastructure/workers/sla.worker';

const bootstrap = async (): Promise<void> => {
  // ── 1. Config ──────────────────────────────────────────────────────────────
  const config = AppConfig.load();
  AppConfig.validate(config);
  logger.info({ nodeEnv: config.nodeEnv }, 'Configuration loaded');

  // ── 2. DI container ────────────────────────────────────────────────────────
  setupContainer();
  logger.info('DI container ready');

  // ── 3. SLA worker is live (imported above) ────────────────────────────────
  logger.info('SLA background worker started');

  // ── 4. HTTP & WebSocket server ─────────────────────────────────────────────
  const app    = createServer();
  const server = app.listen(env.port, () => {
    logger.info(
      { port: env.port, nodeEnv: env.nodeEnv },
      'HireFlow backend started successfully',
    );
  });

  // Initialize WebSockets
  wsService.initialize(server);
  
  logger.info('  Module routes  → /api/v1/*  (Prisma + JWT + multi-tenant)');
  logger.info('  Clean-arch API → /api/*     (DI container + AI pipeline)');
  logger.info(`  Health check   → http://localhost:${env.port}/api/health`);
  logger.info(`  Swagger Docs   → http://localhost:${env.port}/api-docs`);

  // ── 5. Graceful shutdown ───────────────────────────────────────────────────
  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Shutdown signal received — closing server');
    server.close((err) => {
      if (err) {
        logger.error({ err }, 'Error closing HTTP server');
        process.exit(1);
      }
      logger.info('HTTP server closed cleanly');
      process.exit(0);
    });
  };

  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Catch unhandled promise rejections so they don't silently fail
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
};

bootstrap().catch((err) => {
  // Use console here because logger may not have initialised yet
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
