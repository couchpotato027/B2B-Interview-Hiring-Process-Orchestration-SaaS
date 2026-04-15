import cron from 'node-cron';
import { IFileStorageService } from '../../domain/services/IFileStorageService';
import { IFileRepository } from '../../domain/repositories/IFileRepository';
import { logger } from '../logging/logger';
import { Container } from '../di/Container';

export class CleanupOrphanedFilesJob {
  private readonly schedule: string;

  constructor(schedule: string = '0 0 * * *') { // Default: Every day at midnight
    this.schedule = schedule;
  }

  public start(): void {
    cron.schedule(this.schedule, async () => {
      logger.info('[CleanupJob] Starting file cleanup process...');
      
      const container = Container.getInstance();
      const storageService = container.resolve<IFileStorageService>('FileStorageService');
      const fileRepository = container.resolve<IFileRepository>('FileRepository');

      try {
        // 1. Find soft-deleted files older than 30 days
        const deletedFiles = await fileRepository.findSoftDeletedFiles(30);
        logger.info(`[CleanupJob] Found ${deletedFiles.length} soft-deleted files to permanent delete.`);

        for (const file of deletedFiles) {
          try {
            await storageService.deleteFile(file.getStoragePath());
            await fileRepository.delete(file.getId(), file.getOrganizationId());
            logger.info(`[CleanupJob] Permanently deleted file: ${file.getId()}`);
          } catch (err) {
            logger.error(`[CleanupJob] Failed to delete file ${file.getId()}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        // 2. Find orphaned files (Placeholder for more complex logic)
        // In this implementation, orphaned files are handled as soft-deleted for safety
        
        logger.info('[CleanupJob] File cleanup process completed.');
      } catch (error) {
        logger.error(`[CleanupJob] Cleanup process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    logger.info(`[CleanupJob] Scheduled with pattern: ${this.schedule}`);
  }
}
