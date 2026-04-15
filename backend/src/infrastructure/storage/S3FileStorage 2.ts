import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { IFileStorageService, FileMetadata } from '../../domain/services/IFileStorageService';

export class S3FileStorage implements IFileStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(config: { bucket: string; region: string; accessKeyId?: string; secretAccessKey?: string }) {
    this.bucket = config.bucket;
    this.region = config.region;
    
    this.client = new S3Client({
      region: config.region,
      credentials: config.accessKeyId && config.secretAccessKey ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      } : undefined, // Uses default provider chain if not provided
    });
  }

  public async uploadFile(file: Buffer, fileName: string, folder: string): Promise<Partial<FileMetadata>> {
    const fileId = uuidv4();
    const extension = path.extname(fileName);
    const storedName = `${fileId}${extension}`;
    const storagePath = `${folder}/${storedName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
        Body: file,
        ContentType: this.getMimeType(extension),
      })
    );

    return {
      id: fileId,
      originalName: fileName,
      storedName: storedName,
      size: file.length,
      mimeType: this.getMimeType(extension),
      uploadedAt: new Date(),
      storagePath: storagePath,
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${storagePath}`,
    };
  }

  public async downloadFile(storagePath: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      })
    );

    if (!response.Body) {
      throw new Error(`Could not read file body from S3 at ${storagePath}`);
    }

    const arrayBuffer = await response.Body.transformToByteArray();
    return Buffer.from(arrayBuffer);
  }

  public async deleteFile(storagePath: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      })
    );
  }

  public async generateSignedUrl(storagePath: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    });

    return getSignedUrl(this.client, command, { expiresIn });
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
