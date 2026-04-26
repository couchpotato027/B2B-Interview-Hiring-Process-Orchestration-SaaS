import { Email } from '../value-objects/Email';

export interface ParsedResumeProject {
  title: string;
  description: string;
  technologies?: string[];
}

export interface ParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  projects?: ParsedResumeProject[];
  score?: number;
}

export interface ResumeProps {
  id: string;
  candidateId: string;
  fileId?: string;
  fileName: string;
  rawText: string;
  parsedData: ParsedResumeData;
  organizationId: string;
  uploadedAt: Date;
  thumbnailUrl?: string;
  pageCount?: number;
}

export class Resume {
  private readonly id: string;
  private readonly candidateId: string;
  private fileId?: string;
  private readonly fileName: string;
  private rawText: string;
  private parsedData: ParsedResumeData;
  private readonly organizationId: string;
  private readonly uploadedAt: Date;
  private thumbnailUrl?: string;
  private pageCount?: number;

  constructor(props: ResumeProps) {
    this.id = Resume.requireNonEmpty(props.id, 'Resume id is required.');
    this.candidateId = Resume.requireNonEmpty(props.candidateId, 'Candidate id is required.');
    this.fileId = props.fileId;
    this.fileName = Resume.requireNonEmpty(props.fileName, 'File name is required.');
    this.rawText = Resume.requireNonEmpty(props.rawText, 'Raw text is required.');
    this.parsedData = Resume.validateParsedData(props.parsedData);
    this.organizationId = Resume.requireNonEmpty(props.organizationId, 'Organization id is required.');
    this.uploadedAt = Resume.validateDate(props.uploadedAt, 'Uploaded date is invalid.');
    this.thumbnailUrl = props.thumbnailUrl;
    this.pageCount = props.pageCount;
  }

  public getId(): string {
    return this.id;
  }

  public getCandidateId(): string {
    return this.candidateId;
  }

  public getFileId(): string | undefined {
    return this.fileId;
  }

  public getFileName(): string {
    return this.fileName;
  }

  public getRawText(): string {
    return this.rawText;
  }

  public getParsedData(): ParsedResumeData {
    return Resume.cloneParsedData(this.parsedData);
  }

  public getUploadedAt(): Date {
    return new Date(this.uploadedAt);
  }

  public getOrganizationId(): string {
    return this.organizationId;
  }

  public getThumbnailUrl(): string | undefined {
    return this.thumbnailUrl;
  }

  public getPageCount(): number | undefined {
    return this.pageCount;
  }

  public setFileId(fileId: string): void {
    this.fileId = fileId;
  }

  public setThumbnailUrl(url: string): void {
    this.thumbnailUrl = url;
  }

  public setPageCount(count: number): void {
    this.pageCount = count;
  }

  public updateParsedData(data: ParsedResumeData): void {
    this.parsedData = Resume.validateParsedData(data);
  }

  private static validateParsedData(data: ParsedResumeData): ParsedResumeData {
    if (data.email !== undefined && data.email.trim()) {
      try {
        new Email(data.email);
      } catch {
        // Invalid email from parser — clear it rather than crashing
        data = { ...data, email: undefined };
      }
    }

    return Resume.cloneParsedData({
      ...data,
      name: data.name?.trim(),
      phone: data.phone?.trim() || undefined,
      experience: data.experience?.trim() || undefined,
      education: data.education?.trim(),
      skills: data.skills ? Resume.normalizeSkills(data.skills) : undefined,
      projects: data.projects?.map((project) => ({
        title: (project.title || 'Untitled Project').trim(),
        description: (project.description || 'No description provided').trim(),
        technologies: project.technologies ? Resume.normalizeSkills(project.technologies) : [],
      })),
    });
  }

  private static cloneParsedData(data: ParsedResumeData): ParsedResumeData {
    return {
      ...data,
      skills: data.skills ? [...data.skills] : undefined,
      projects: data.projects?.map((project) => ({
        ...project,
        technologies: project.technologies ? [...project.technologies] : undefined,
      })),
    };
  }

  private static normalizeSkills(skills: string[]): string[] {
    return [...new Set(skills.map((s) => (s || '').trim()).filter(Boolean))];
  }

  private static validateDate(value: Date, message: string): Date {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new Error(message);
    }

    return new Date(value);
  }

  private static requireNonEmpty(value: string, message: string): string {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new Error(message);
    }

    return normalizedValue;
  }
}
