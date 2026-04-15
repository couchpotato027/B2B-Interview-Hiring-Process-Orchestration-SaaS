import { IFileStorageService } from '../../domain/services/IFileStorageService';
import { IFileRepository } from '../../domain/repositories/IFileRepository';
import { Result } from '../../shared/Result';

export interface DownloadResumeInput {
  fileId: string;
  organizationId: string;
}

export interface DownloadResumeOutput {
  buffer?: Buffer;
  url: string;
  fileName: string;
  mimeType: string;
}

export class DownloadResumeUseCase {
  constructor(
    private readonly storageService: IFileStorageService,
    private readonly fileRepository: IFileRepository
  ) {}

  public async execute(input: DownloadResumeInput): Promise<Result<DownloadResumeOutput>> {
    try {
      // 1. Find file metadata
      const file = await this.fileRepository.findById(input.fileId, input.organizationId);
      
      if (!file) {
        return { success: false, error: 'File not found.', code: 'FILE_NOT_FOUND' };
      }

      if (file.getIsDeleted()) {
        return { success: false, error: 'File has been deleted.', code: 'FILE_DELETED' };
      }

      // 2. Generate signed URL or download buffer
      // For resumes, we typically provide a signed URL for preview or current download
      const signedUrl = await this.storageService.generateSignedUrl(file.getStoragePath(), 3600); // 1 hour

      return {
        success: true,
        data: {
          url: signedUrl,
          fileName: file.getName(),
          mimeType: file.getType()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
        code: 'DOWNLOAD_FAILED'
      };
    }
  }
}
