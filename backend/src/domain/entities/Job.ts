export type JobStatus = 'open' | 'closed';

export interface ScoringWeights {
  skillMatch?: number;
  experience?: number;
  education?: number;
  projects?: number;
  culturalFit?: number;
}

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
  pipelineTemplateId?: string;
  scoringWeights?: ScoringWeights;
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
  private pipelineTemplateId?: string;
  private scoringWeights?: ScoringWeights;

  constructor(props: JobProps) {
    this.id = props.id || '';
    this.organizationId = props.organizationId || '';
    this.title = (props.title || 'Untitled Job').trim();
    this.department = (props.department || 'General').trim();
    this.description = (props.description || 'No description provided.').trim();
    this.requiredSkills = Job.validateRequiredSkills(props.requiredSkills);
    this.preferredSkills = Job.normalizeSkills(props.preferredSkills);
    this.requiredExperience = props.requiredExperience ?? 0;
    this.status = props.status || 'open';
    this.pipelineTemplateId = props.pipelineTemplateId;
    this.scoringWeights = props.scoringWeights;

    // Log warnings for data quality but don't crash the server during hydration
    if (!props.id) console.warn('Job initialized without ID');
    if (!props.title) console.warn('Job initialized without title:', props.id);
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

  public getPipelineTemplateId(): string | undefined {
    return this.pipelineTemplateId;
  }

  public getScoringWeights(): ScoringWeights | undefined {
    return this.scoringWeights;
  }

  public setScoringWeights(weights: ScoringWeights): void {
    this.scoringWeights = weights;
  }

  public addRequiredSkill(skill: string): void {
    const normalizedSkill = (skill || '').trim();

    if (normalizedSkill && !this.requiredSkills.includes(normalizedSkill)) {
      this.requiredSkills.push(normalizedSkill);
    }
  }

  public close(): void {
    this.status = 'closed';
  }

  private static validateRequiredSkills(skills: string[]): string[] {
    return Job.normalizeSkills(skills ?? []);
  }

  private static validateExperience(requiredExperience: number): number {
    if (!Number.isFinite(requiredExperience) || requiredExperience < 0) {
      console.warn('Invalid required experience:', requiredExperience);
      return 0;
    }
    return requiredExperience;
  }

  private static normalizeSkills(skills: string[]): string[] {
    if (!Array.isArray(skills)) return [];
    return Array.from(new Set(skills.map((skill) => (skill || '').trim()).filter(Boolean)));
  }

  private static requireNonEmpty(value: string, message: string): string {
    const normalizedValue = (value || '').trim();
    if (!normalizedValue) {
      return '';
    }
    return normalizedValue;
  }
}
