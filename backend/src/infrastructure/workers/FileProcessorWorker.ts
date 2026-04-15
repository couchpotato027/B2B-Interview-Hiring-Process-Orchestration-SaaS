// FileProcessorWorker is DISABLED when Redis is not available
// This prevents IORedis from crashing the server on startup
import { logger } from '../logging/logger';

export const FILE_PROCESSING_QUEUE = 'file-processing-queue';

export class FileProcessorWorker {
  constructor() {
    if (!process.env.REDIS_URL) {
      logger.info('FileProcessorWorker: Skipped (REDIS_URL not set)');
      return;
    }
    logger.info('FileProcessorWorker: Skipped (Redis integration disabled for demo)');
  }
}
