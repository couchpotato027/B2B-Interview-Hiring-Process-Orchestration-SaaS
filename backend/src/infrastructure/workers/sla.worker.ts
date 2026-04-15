// SLA Worker is DISABLED when Redis is not available
// This prevents IORedis from crashing the server on startup
import { logger } from '../logging/logger';

let slaWorkerInstance: any = null;

if (process.env.REDIS_URL) {
  logger.info('SLA Worker: Skipped (Redis integration disabled for demo)');
} else {
  logger.info('SLA Worker: Skipped (REDIS_URL not set)');
}

export const slaWorker = slaWorkerInstance;
