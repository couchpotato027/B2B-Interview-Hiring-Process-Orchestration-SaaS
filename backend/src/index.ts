import { AppConfig } from './infrastructure/config/AppConfig';
import { env } from './infrastructure/config/env';
import { setupContainer } from './infrastructure/di/setupContainer';
import { logger } from './infrastructure/logging/logger';
import { createServer } from './presentation/server';

const bootstrap = () => {
  const config = AppConfig.load();
  AppConfig.validate(config);

  setupContainer();

  const app = createServer();
  const server = app.listen(env.port, () => {
    logger.info(
      {
        port: env.port,
        nodeEnv: env.nodeEnv,
      },
      'HireFlow backend started successfully',
    );
  });

  const shutdown = (signal: NodeJS.Signals) => {
    logger.info({ signal }, 'Shutdown signal received');
    server.close((error) => {
      if (error) {
        logger.error({ err: error }, 'Failed to close server cleanly');
        process.exit(1);
      }

      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

bootstrap();
