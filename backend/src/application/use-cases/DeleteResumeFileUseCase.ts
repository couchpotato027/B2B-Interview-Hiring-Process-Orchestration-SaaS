import { IFileRepository } from '../../domain/repositories/IFileRepository';
import { Result } from '../../shared/Result';

export interface DeleteResumeFileInput {
  fileId: string;
  organizationId: string;
}

export class DeleteResumeFileUseCase {
  constructor(private readonly fileRepository: IFileRepository) {}

  public async execute(input: DeleteResumeFileInput): Promise<Result<void>> {
    try {
      // 1. Find file metadata
      const file = await this.fileRepository.findById(input.fileId, input.organizationId);

      if (!file) {
        return { success: false, error: 'File not found.', code: 'FILE_NOT_FOUND' };
      }

      // 2. Soft delete - mark as deleted but keep in DB/Storage for 30 days
      file.softDelete();

      // 3. Update repository
      await this.fileRepository.update(file.getId(), file, input.organizationId);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deletion failed',
        code: 'DELETE_FAILED'
      };
    }
  }
}
