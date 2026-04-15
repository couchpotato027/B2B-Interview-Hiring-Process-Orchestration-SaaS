export type JobStatus = 'open' | 'closed';

export interface JobProps {
  id: string;
  organizationId: string;
  title: string;
  department: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredExperience: number;
  status: JobStatus;
}

export class Job {
  private readonly id: string;
  private readonly organizationId: string;
  private title: string;
  private department: string;
  private description: string;
  private requiredSkills: string[];
  private preferredSkills: string[];
  private requiredExperience: number;
  private status: JobStatus;

  constructor(props: JobProps) {
    this.id = Job.requireNonEmpty(props.id, 'Job id is required.');
    this.organizationId = Job.requireNonEmpty(props.organizationId, 'Organization id is required.');
    this.title = Job.requireNonEmpty(props.title, 'Job title is required.');
    this.department = Job.requireNonEmpty(props.department, 'Department is required.');
    this.description = Job.requireNonEmpty(props.description, 'Description is required.');
    this.requiredSkills = Job.validateRequiredSkills(props.requiredSkills);
    this.preferredSkills = Job.normalizeSkills(props.preferredSkills);
    this.requiredExperience = Job.validateExperience(props.requiredExperience);
    this.status = props.status;
  }

  public getId(): string {
    return this.id;
  }
  
  public getOrganizationId(): string {
    return this.organizationId;
  }

  public getTitle(): string {
    return this.title;
  }

  public getDepartment(): string {
    return this.department;
  }

  public getDescription(): string {
    return this.description;
  }

  public getRequiredSkills(): string[] {
    return [...this.requiredSkills];
  }

  public getPreferredSkills(): string[] {
    return [...this.preferredSkills];
  }

  public getRequiredExperience(): number {
    return this.requiredExperience;
  }

  public getStatus(): JobStatus {
    return this.status;
  }

  public addRequiredSkill(skill: string): void {
    const normalizedSkill = Job.requireNonEmpty(skill, 'Required skill is required.');

    if (!this.requiredSkills.includes(normalizedSkill)) {
      this.requiredSkills.push(normalizedSkill);
    }
  }

  public close(): void {
    this.status = 'closed';
  }

  private static validateRequiredSkills(skills: string[]): string[] {
    const normalizedSkills = Job.normalizeSkills(skills);

    if (normalizedSkills.length === 0) {
      throw new Error('At least one required skill must be provided.');
    }

    return normalizedSkills;
  }

  private static validateExperience(requiredExperience: number): number {
    if (!Number.isFinite(requiredExperience) || requiredExperience < 0) {
      throw new Error('Required experience must be greater than or equal to 0.');
    }

    return requiredExperience;
  }

  private static normalizeSkills(skills: string[]): string[] {
    return Array.from(new Set(skills.map((skill) => Job.requireNonEmpty(skill, 'Skill is required.'))));
  }

  private static requireNonEmpty(value: string, message: string): string {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new Error(message);
    }

    return normalizedValue;
  }
}
