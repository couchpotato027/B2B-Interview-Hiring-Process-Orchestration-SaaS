import { randomUUID } from 'crypto';
import { IFileStorageService } from '../../domain/services/IFileStorageService';
import { IFileRepository } from '../../domain/repositories/IFileRepository';
import { File } from '../../domain/entities/File';
import { Result } from '../../shared/Result';
import { EventEmitter } from '../../infrastructure/events/EventEmitter';

export interface UploadResumeFileInput {
  file: Buffer;
  fileName: string;
  uploadedBy: string;
  organizationId: string;
}

export interface UploadResumeFileOutput {
  fileId: string;
  url: string;
  storagePath: string;
}

export class UploadResumeFileUseCase {
  constructor(
    private readonly storageService: IFileStorageService,
    private readonly fileRepository: IFileRepository,
    private readonly eventEmitter: EventEmitter = EventEmitter.getInstance()
  ) {}

  public async execute(input: UploadResumeFileInput): Promise<Result<UploadResumeFileOutput>> {
    try {
      // 1. Validate file (Middleware usually handles this, but we reinforce here)
      if (input.file.length > 10 * 1024 * 1024) {
        return { success: false, error: 'File size exceeds 10MB limit.', code: 'FILE_TOO_LARGE' };
      }

      const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
      const extension = input.fileName.slice(input.fileName.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        return { success: false, error: 'Invalid file type. Only PDF, DOCX, and TXT are allowed.', code: 'INVALID_FILE_TYPE' };
      }

      // 2. Prepare folder path: organizationId/year/month
      const now = new Date();
      const folder = `${input.organizationId}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;

      // 3. Upload to storage
      const metadata = await this.storageService.uploadFile(input.file, input.fileName, folder);

      // 4. Create File entity
      const fileEntity = new File({
        id: metadata.id!,
        name: input.fileName,
        type: metadata.mimeType!,
        size: metadata.size!,
        storagePath: metadata.storagePath!,
        uploadedBy: input.uploadedBy,
        uploadedAt: now,
        organizationId: input.organizationId
      });

      // 5. Save metadata to repository
      await this.fileRepository.save(fileEntity);

      // 6. Emit event for background processing (Thumbnail, Text Extraction)
      await this.eventEmitter.emit({
        eventType: 'FileUploadedEvent',
        timestamp: new Date(),
        payload: {
          fileId: fileEntity.getId(),
          storagePath: fileEntity.getStoragePath(),
          organizationId: fileEntity.getOrganizationId(),
          mimeType: fileEntity.getType()
        }
      });

      return {
        success: true,
        data: {
          fileId: fileEntity.getId(),
          url: metadata.url!,
          storagePath: fileEntity.getStoragePath()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File upload failed',
        code: 'UPLOAD_FAILED'
      };
    }
  }
}
