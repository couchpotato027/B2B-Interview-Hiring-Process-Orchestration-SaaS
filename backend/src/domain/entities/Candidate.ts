import { Email } from '../value-objects/Email';

export type CandidateStatus = 'active' | 'archived';

export interface CandidateProject {
  title: string;
  description: string;
  technologies: string[];
}

export interface CandidateProps {
  id: string;
  name: string;
  email: string;
  phone: string;
  tenantId: string;
  resumeId: string;
  skills: string[];
  yearsOfExperience: number;
  education: string;
  projects: CandidateProject[];
  status: CandidateStatus;
}

export class Candidate {
  private readonly id: string;
  private name: string;
  private email: Email;
  private phone: string;
  private tenantId: string;
  private resumeId: string;
  private skills: string[];
  private yearsOfExperience: number;
  private education: string;
  private projects: CandidateProject[];
  private status: CandidateStatus;

  constructor(props: CandidateProps) {
    Candidate.validateName(props.name);
    Candidate.validateExperience(props.yearsOfExperience);

    this.id = Candidate.requireNonEmpty(props.id, 'Candidate id is required.');
    this.name = props.name.trim();
    this.email = new Email(props.email);
    this.phone = Candidate.requireNonEmpty(props.phone, 'Candidate phone is required.');
    this.tenantId = Candidate.requireNonEmpty(props.tenantId, 'Tenant id is required.');
    this.resumeId = Candidate.requireNonEmpty(props.resumeId, 'Resume id is required.');
    this.skills = Candidate.normalizeSkills(props.skills);
    this.yearsOfExperience = props.yearsOfExperience;
    this.education = Candidate.requireNonEmpty(props.education, 'Education is required.');
    this.projects = Candidate.validateProjects(props.projects);
    this.status = props.status;
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

  public getResumeId(): string {
    return this.resumeId;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getSkills(): string[] {
    return [...this.skills];
  }

  public getYearsOfExperience(): number {
    return this.yearsOfExperience;
  }

  public getEducation(): string {
    return this.education;
  }

  public getProjects(): CandidateProject[] {
    return this.projects.map((project) => ({
      ...project,
      technologies: [...project.technologies],
    }));
  }

  public getStatus(): CandidateStatus {
    return this.status;
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
    if (!name.trim()) {
      throw new Error('Candidate name cannot be empty.');
    }
  }

  private static validateExperience(yearsOfExperience: number): void {
    if (!Number.isFinite(yearsOfExperience) || yearsOfExperience < 0) {
      throw new Error('Years of experience must be greater than or equal to 0.');
    }
  }

  private static normalizeSkills(skills: string[]): string[] {
    return Array.from(new Set(skills.map((skill) => Candidate.requireNonEmpty(skill, 'Skill is required.'))));
  }

  private static validateProjects(projects: CandidateProject[]): CandidateProject[] {
    return projects.map((project) => ({
      title: Candidate.requireNonEmpty(project.title, 'Project title is required.'),
      description: Candidate.requireNonEmpty(project.description, 'Project description is required.'),
      technologies: Candidate.normalizeSkills(project.technologies),
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
