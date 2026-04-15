import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { IFileStorageService, FileMetadata } from '../../domain/services/IFileStorageService';

export class LocalFileStorage implements IFileStorageService {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(uploadDir: string = 'uploads', baseUrl: string = 'http://localhost:3001/uploads') {
    this.uploadDir = path.isAbsolute(uploadDir) ? uploadDir : path.resolve(process.cwd(), uploadDir);
    this.baseUrl = baseUrl;
  }

  public async uploadFile(file: Buffer, fileName: string, folder: string): Promise<Partial<FileMetadata>> {
    const fileId = uuidv4();
    const extension = path.extname(fileName);
    const storedName = `${fileId}${extension}`;
    const relativePath = path.join(folder, storedName);
    const fullPath = path.join(this.uploadDir, relativePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write file
    await fs.writeFile(fullPath, file);

    const stats = await fs.stat(fullPath);

    return {
      id: fileId,
      originalName: fileName,
      storedName: storedName,
      size: stats.size,
      mimeType: this.getMimeType(extension),
      uploadedAt: new Date(),
      storagePath: relativePath,
      url: `${this.baseUrl}/${relativePath.replace(/\\/g, '/')}`,
    };
  }

  public async downloadFile(storagePath: string): Promise<Buffer> {
    const fullPath = path.join(this.uploadDir, storagePath);
    try {
      return await fs.readFile(fullPath);
    } catch (error) {
      throw new Error(`File not found at ${storagePath}`);
    }
  }

  public async deleteFile(storagePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, storagePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // Silently ignore if file already deleted
    }
  }

  public async generateSignedUrl(storagePath: string, expiresIn: number): Promise<string> {
    // Local storage doesn't really have "signed" URLs in this basic implementation
    // Just return the standard URL
    return `${this.baseUrl}/${storagePath.replace(/\\/g, '/')}`;
  }

  private getMimeType(extension: string): string {
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.txt': 'text/plain',
    };
    return mimeMap[extension.toLowerCase()] || 'application/octet-stream';
  }
}
