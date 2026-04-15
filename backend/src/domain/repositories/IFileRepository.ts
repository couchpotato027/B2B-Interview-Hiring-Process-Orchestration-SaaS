import { File } from '../entities/File';

export interface IFileRepository {
  findById(id: string, organizationId: string): Promise<File | null>;
  findAll(organizationId: string): Promise<File[]>;
  save(file: File): Promise<File>;
  update(id: string, file: File, organizationId: string): Promise<File>;
  delete(id: string, organizationId: string): Promise<void>;
  findOrphanedFiles(daysOld: number): Promise<File[]>;
  findSoftDeletedFiles(daysOld: number): Promise<File[]>;
}
