import { File } from '../../domain/entities/File';
import { IFileRepository } from '../../domain/repositories/IFileRepository';

export class InMemoryFileRepository implements IFileRepository {
  private readonly store = new Map<string, File>();

  public async findById(id: string, organizationId: string): Promise<File | null> {
    const file = this.store.get(id);
    if (file && file.getOrganizationId() === organizationId) {
      return file;
    }
    return null;
  }

  public async findAll(organizationId: string): Promise<File[]> {
    return Array.from(this.store.values()).filter(
      (f) => f.getOrganizationId() === organizationId
    );
  }

  public async save(file: File): Promise<File> {
    this.store.set(file.getId(), file);
    return file;
  }

  public async update(id: string, file: File, organizationId: string): Promise<File> {
    const existing = this.store.get(id);
    if (!existing || existing.getOrganizationId() !== organizationId) {
      throw new Error(`File with id ${id} not found in your organization.`);
    }
    this.store.set(id, file);
    return file;
  }

  public async delete(id: string, organizationId: string): Promise<void> {
    const existing = this.store.get(id);
    if (existing && existing.getOrganizationId() === organizationId) {
      this.store.delete(id);
    }
  }

  public async findOrphanedFiles(daysOld: number): Promise<File[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // This is a simplified check for the in-memory version
    // In a real DB, we would join with the Resume table to find files without a reference
    return Array.from(this.store.values()).filter(
      (f) => f.getUploadedAt() < cutoffDate && !f.getIsDeleted()
    );
  }

  public async findSoftDeletedFiles(daysOld: number): Promise<File[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return Array.from(this.store.values()).filter(
      (f) => f.getIsDeleted() && f.getUploadedAt() < cutoffDate
    );
  }
}
