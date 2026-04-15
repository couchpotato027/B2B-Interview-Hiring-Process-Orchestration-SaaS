export interface FileMetadata {
  id: string;
  originalName: string;
  storedName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  url: string;
  storagePath: string;
  organizationId: string;
}

export interface IFileStorageService {
  /**
   * Uploads a file buffer to storage.
   * @param file - The file buffer
   * @param fileName - Original file name
   * @param folder - Destination folder (e.g., organizationId/year/month)
   * @returns Metadata of the uploaded file
   */
  uploadFile(file: Buffer, fileName: string, folder: string): Promise<Partial<FileMetadata>>;

  /**
   * Downloads a file from storage.
   * @param storagePath - The path where the file is stored
   * @returns The file buffer
   */
  downloadFile(storagePath: string): Promise<Buffer>;

  /**
   * Deletes a file from storage.
   * @param storagePath - The path where the file is stored
   */
  deleteFile(storagePath: string): Promise<void>;

  /**
   * Generates a signed URL for secure access.
   * @param storagePath - The path where the file is stored
   * @param expiresIn - Expiration time in seconds
   * @returns A signed URL
   */
  generateSignedUrl(storagePath: string, expiresIn: number): Promise<string>;
}
