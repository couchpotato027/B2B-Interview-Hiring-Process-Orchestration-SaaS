import { Worker, Job, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { IFileStorageService } from '../../domain/services/IFileStorageService';
import { IFileRepository } from '../../domain/repositories/IFileRepository';
import { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import { logger } from '../logging/logger';
import { Container } from '../di/Container';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

export const FILE_PROCESSING_QUEUE = 'file-processing-queue';

export class FileProcessorWorker {
  private readonly worker: Worker;

  constructor() {
    this.worker = new Worker(
      FILE_PROCESSING_QUEUE,
      async (job: Job) => {
        const { fileId, storagePath, organizationId, mimeType } = job.data;
        logger.info(`Processing file: ${fileId} (${mimeType})`);

        const container = Container.getInstance();
        const storageService = container.resolve<IFileStorageService>('FileStorageService');
        const fileRepository = container.resolve<IFileRepository>('FileRepository');
        const resumeRepository = container.resolve<IResumeRepository>('ResumeRepository');

        try {
          // 1. Download file buffer
          const buffer = await storageService.downloadFile(storagePath);

          // 2. Extract Text (if PDF or TXT)
          let extractedText = '';
          if (mimeType === 'application/pdf' || mimeType === 'text/plain') {
            // Text extraction logic (using pdf-parse/mammoth as placeholders)
            extractedText = '[Extracted Text Placeholder]';
          }

          // 3. Generate Thumbnail (if PDF)
          let thumbnailUrl = '';
          if (mimeType === 'application/pdf') {
            // Rendering logic (placeholder)
            thumbnailUrl = `[Thumbnail Placeholder for ${fileId}]`;
          }

          // 4. Update Resume association (if exists)
          const resume = await resumeRepository.findByCandidateId(job.data.candidateId || '', organizationId);
          if (resume) {
            if (thumbnailUrl) resume.setThumbnailUrl(thumbnailUrl);
            // In a real app we'd also update the searchable index with extractedText
            await resumeRepository.update(resume.getId(), resume, organizationId);
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
  }
}
