export interface FileProps {
  id: string;
  name: string;
  type: string;
  size: number;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: Date;
  organizationId: string;
  isDeleted?: boolean;
}

export class File {
  private readonly id: string;
  private name: string;
  private readonly type: string;
  private readonly size: number;
  private readonly storagePath: string;
  private readonly uploadedBy: string;
  private readonly uploadedAt: Date;
  private readonly organizationId: string;
  private isDeleted: boolean;

  constructor(props: FileProps) {
    this.id = props.id;
    this.name = props.name;
    this.type = props.type;
    this.size = props.size;
    this.storagePath = props.storagePath;
    this.uploadedBy = props.uploadedBy;
    this.uploadedAt = props.uploadedAt || new Date();
    this.organizationId = props.organizationId;
    this.isDeleted = props.isDeleted || false;
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getType(): string {
    return this.type;
  }

  public getSize(): number {
    return this.size;
  }

  public getStoragePath(): string {
    return this.storagePath;
  }

  public getUploadedBy(): string {
    return this.uploadedBy;
  }

  public getUploadedAt(): Date {
    return this.uploadedAt;
  }

  public getOrganizationId(): string {
    return this.organizationId;
  }

  public getIsDeleted(): boolean {
    return this.isDeleted;
  }

  public softDelete(): void {
    this.isDeleted = true;
  }

  public rename(newName: string): void {
    this.name = newName;
  }
}
