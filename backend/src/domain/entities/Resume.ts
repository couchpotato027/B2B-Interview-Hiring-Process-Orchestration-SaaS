import { Email } from '../value-objects/Email';

export interface ParsedResumeProject {
  title: string;
  description: string;
}

export interface ParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  projects?: ParsedResumeProject[];
}

export interface ResumeProps {
  id: string;
  candidateId: string;
  fileName: string;
  rawText: string;
  parsedData: ParsedResumeData;
  uploadedAt: Date;
}

export class Resume {
  private readonly id: string;
  private readonly candidateId: string;
  private readonly fileName: string;
  private rawText: string;
  private parsedData: ParsedResumeData;
  private readonly uploadedAt: Date;

  constructor(props: ResumeProps) {
    this.id = Resume.requireNonEmpty(props.id, 'Resume id is required.');
    this.candidateId = Resume.requireNonEmpty(props.candidateId, 'Candidate id is required.');
    this.fileName = Resume.requireNonEmpty(props.fileName, 'File name is required.');
    this.rawText = Resume.requireNonEmpty(props.rawText, 'Raw text is required.');
    this.parsedData = Resume.validateParsedData(props.parsedData);
    this.uploadedAt = Resume.validateDate(props.uploadedAt, 'Uploaded date is invalid.');
  }

  public getId(): string {
    return this.id;
  }

  public getCandidateId(): string {
    return this.candidateId;
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

  public updateParsedData(data: ParsedResumeData): void {
    this.parsedData = Resume.validateParsedData(data);
  }

  private static validateParsedData(data: ParsedResumeData): ParsedResumeData {
    if (data.email !== undefined) {
      new Email(data.email);
    }

    if (data.phone !== undefined && !data.phone.trim()) {
      throw new Error('Parsed phone cannot be empty.');
    }

    if (data.experience !== undefined && !data.experience.trim()) {
      throw new Error('Parsed experience cannot be empty.');
    }

    return Resume.cloneParsedData({
      ...data,
      name: data.name?.trim(),
      phone: data.phone?.trim(),
      experience: data.experience?.trim(),
      education: data.education?.trim(),
      skills: data.skills ? Resume.normalizeSkills(data.skills) : undefined,
      projects: data.projects?.map((project) => ({
        title: Resume.requireNonEmpty(project.title, 'Project title is required.'),
        description: Resume.requireNonEmpty(project.description, 'Project description is required.'),
      })),
    });
  }

  private static cloneParsedData(data: ParsedResumeData): ParsedResumeData {
    return {
      ...data,
      skills: data.skills ? [...data.skills] : undefined,
      projects: data.projects?.map((project) => ({
        ...project,
      })),
    };
  }

  private static normalizeSkills(skills: string[]): string[] {
    return [...new Set(skills.map((skill) => Resume.requireNonEmpty(skill, 'Skill is required.')))];
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
