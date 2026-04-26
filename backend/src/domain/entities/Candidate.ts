import { Email } from '../value-objects/Email';

export type CandidateStatus = 'active' | 'rejected' | 'hired' | 'on_hold' | 'archived';

export interface CandidateProject {
  title: string;
  description: string;
  technologies: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface CandidateEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CandidateProps {
  id: string;
  name: string;
  email: string;
  phone: string;
  summary?: string;
  organizationId: string;
  pipelineId: string;
  currentStageId?: string;
  resumeId: string;
  resumeUrl?: string;
  jobId?: string;
  skills: string[];
  yearsOfExperience: number;
  education: CandidateEducation[];
  projects: CandidateProject[];
  status: CandidateStatus;
  stageHistory?: any[];
  createdAt?: Date;
  assignedRecruiterId?: string;
  score?: number;
}

export class Candidate {
  private readonly id: string;
  private name: string;
  private email: Email;
  private phone: string;
  private summary: string;
  private organizationId: string;
  private pipelineId: string;
  private currentStageId: string;
  private resumeId: string;
  private resumeUrl?: string;
  private jobId?: string;
  private skills: string[];
  private yearsOfExperience: number;
  private education: CandidateEducation[];
  private projects: CandidateProject[];
  private status: CandidateStatus;
  private stageHistory: any[];
  private readonly createdAt: Date;
  private assignedRecruiterId?: string;
  private score: number;

  constructor(props: CandidateProps) {
    Candidate.validateName(props.name);
    Candidate.validateExperience(props.yearsOfExperience);

    // Use tolerant helpers so legacy DB records without all fields
    // can still be hydrated. Input validation is enforced at the route layer.
    this.id = props.id || '';
    this.name = (props.name || '').trim();
    this.email = new Email(props.email);
    this.phone = props.phone || '';
    this.summary = props.summary || '';
    this.organizationId = props.organizationId || '';
    this.pipelineId = props.pipelineId || '';
    this.currentStageId = props.currentStageId || '';
    this.resumeId = props.resumeId || '';
    this.resumeUrl = props.resumeUrl;
    this.jobId = props.jobId;
    this.skills = Candidate.normalizeSkills(props.skills ?? []);
    this.yearsOfExperience = props.yearsOfExperience ?? 0;
    this.education = Candidate.normalizeEducation(props.education ?? []);
    this.projects = Candidate.normalizeProjects(props.projects ?? []);
    this.status = props.status;
    this.stageHistory = props.stageHistory || [];
    this.createdAt = props.createdAt || new Date();
    this.assignedRecruiterId = props.assignedRecruiterId;
    this.score = props.score ?? 0;
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getEmail(): string {
    return this.email.getValue();
  }

  public getPhone(): string {
    return this.phone;
  }

  public getSummary(): string {
    return this.summary;
  }

  public getResumeId(): string {
    return this.resumeId;
  }

  public getPipelineId(): string {
    return this.pipelineId;
  }

  public getCurrentStageId(): string {
    return this.currentStageId;
  }

  public getOrganizationId(): string {
    return this.organizationId;
  }

  public getResumeUrl(): string | undefined {
    return this.resumeUrl;
  }

  public getJobId(): string | undefined {
    return this.jobId;
  }

  public getSkills(): string[] {
    return [...this.skills];
  }

  public getYearsOfExperience(): number {
    return this.yearsOfExperience;
  }

  public getEducation(): CandidateEducation[] {
    return this.education.map(edu => ({ ...edu }));
  }

  public getProjects(): CandidateProject[] {
    return this.projects.map((project) => ({
      ...project,
      technologies: [...project.technologies],
    }));
  }

  public getAssignedRecruiterId(): string | undefined {
    return this.assignedRecruiterId;
  }

  public setAssignedRecruiterId(recruiterId: string): void {
    this.assignedRecruiterId = recruiterId;
  }

  public getStatus(): CandidateStatus {
    return this.status;
  }

  public getStageHistory(): any[] {
    return this.stageHistory;
  }

  public setStageHistory(history: any[]): void {
    this.stageHistory = history;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getScore(): number {
    return this.score;
  }

  public setScore(score: number): void {
    this.score = score;
  }

  public addSkill(skill: string): void {
    const normalizedSkill = Candidate.requireNonEmpty(skill, 'Skill is required.');

    if (!this.skills.includes(normalizedSkill)) {
      this.skills.push(normalizedSkill);
    }
  }

  public updateStatus(status: CandidateStatus): void {
    this.status = status;
  }

  private static validateName(name: string): void {
    // Tolerant during hydration from DB
    if (!name || !name.trim()) {
      console.warn('Candidate name is empty during hydration');
    }
  }

  private static validateExperience(yearsOfExperience: number): void {
    // Tolerant during hydration from DB
    if (!Number.isFinite(yearsOfExperience) || yearsOfExperience < 0) {
      console.warn('Invalid experience during hydration:', yearsOfExperience);
    }
  }

  private static normalizeSkills(skills: string[]): string[] {
    if (!Array.isArray(skills)) return [];
    return Array.from(new Set(skills.map(s => (s || '').trim()).filter(Boolean)));
  }

  private static normalizeProjects(projects: CandidateProject[]): CandidateProject[] {
    if (!Array.isArray(projects)) return [];
    return projects.map((project) => ({
      title: (project.title || '').trim(),
      description: (project.description || '').trim(),
      technologies: Candidate.normalizeSkills(project.technologies ?? []),
      startDate: project.startDate,
      endDate: project.endDate,
    }));
  }

  private static normalizeEducation(education: CandidateEducation[]): CandidateEducation[] {
    // Returns empty array for legacy records that predate this field.
    // Route-level validation ensures new candidates always provide education.
    if (!Array.isArray(education)) return [];
    return education.map(edu => ({
      institution: (edu.institution || '').trim(),
      degree: (edu.degree || '').trim(),
      fieldOfStudy: (edu.fieldOfStudy || '').trim(),
      startDate: edu.startDate,
      endDate: edu.endDate,
    }));
  }

  private static requireNonEmpty(value: string, message: string): string {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new Error(message);
    }

    return normalizedValue;
  }
}
