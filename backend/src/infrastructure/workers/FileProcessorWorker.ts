import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { IFileStorageService } from '../../domain/services/IFileStorageService';
import { IFileRepository } from '../../domain/repositories/IFileRepository';
import { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import { logger } from '../logging/logger';
import { Container } from '../di/Container';

const FILE_PROCESSING_QUEUE = 'file-processing-queue';

export { FILE_PROCESSING_QUEUE };

export class FileProcessorWorker {
  private worker: Worker | null = null;

  constructor() {
    try {
      const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
        maxRetriesPerRequest: null,
        lazyConnect: true,
        retryStrategy: () => null,
      });
      redisConnection.on('error', () => {}); // Suppress unhandled errors

      this.worker = new Worker(
        FILE_PROCESSING_QUEUE,
        async (job: Job) => {
          const { fileId, mimeType } = job.data;
          logger.info(`Processing file: ${fileId} (${mimeType})`);

          const container = Container.getInstance();
          const storageService = container.resolve<IFileStorageService>('FileStorageService');
          const fileRepository = container.resolve<IFileRepository>('FileRepository');
          const resumeRepository = container.resolve<IResumeRepository>('ResumeRepository');

          try {
            const buffer = await storageService.downloadFile(job.data.storagePath);
            let extractedText = '';
            if (mimeType === 'application/pdf' || mimeType === 'text/plain') {
              extractedText = '[Extracted Text Placeholder]';
            }

            let thumbnailUrl = '';
            if (mimeType === 'application/pdf') {
              thumbnailUrl = `[Thumbnail Placeholder for ${fileId}]`;
            }

            const resume = await resumeRepository.findByCandidateId(job.data.candidateId || '', job.data.organizationId);
            if (resume) {
              if (thumbnailUrl) resume.setThumbnailUrl(thumbnailUrl);
              await resumeRepository.update(resume.getId(), resume, job.data.organizationId);
            }

            logger.info(`File ${fileId} processed successfully.`);
          } catch (error) {
            logger.error(`Error processing file ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
          }
        },
        { connection: redisConnection as any }
      );

      this.worker.on('failed', (job, err) => {
        logger.error(`File processing job ${job?.id} failed: ${err.message}`);
      });
    } catch {
      console.warn('⚠️ FileProcessorWorker: Redis not available, worker disabled');
    }
  }
}
