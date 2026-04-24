import { Email } from '../value-objects/Email';

export type CandidateStatus = 'active' | 'archived';

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
  organizationId: string;
  pipelineId: string;
  resumeId: string;
  skills: string[];
  yearsOfExperience: number;
  education: CandidateEducation[];
  projects: CandidateProject[];
  status: CandidateStatus;
  createdAt?: Date;
}

export class Candidate {
  private readonly id: string;
  private name: string;
  private email: Email;
  private phone: string;
  private organizationId: string;
  private pipelineId: string;
  private resumeId: string;
  private skills: string[];
  private yearsOfExperience: number;
  private education: CandidateEducation[];
  private projects: CandidateProject[];
  private status: CandidateStatus;
  private readonly createdAt: Date;

  constructor(props: CandidateProps) {
    Candidate.validateName(props.name);
    Candidate.validateExperience(props.yearsOfExperience);

    this.id = Candidate.requireNonEmpty(props.id, 'Candidate id is required.');
    this.name = props.name.trim();
    this.email = new Email(props.email);
    this.phone = Candidate.requireNonEmpty(props.phone, 'Candidate phone is required.');
    this.organizationId = Candidate.requireNonEmpty(props.organizationId, 'Organization id is required.');
    this.pipelineId = Candidate.requireNonEmpty(props.pipelineId, 'Pipeline id is required.');
    this.resumeId = Candidate.requireNonEmpty(props.resumeId, 'Resume id is required.');
    this.skills = Candidate.normalizeSkills(props.skills);
    this.yearsOfExperience = props.yearsOfExperience;
    this.education = Candidate.validateEducation(props.education);
    this.projects = Candidate.validateProjects(props.projects);
    this.status = props.status;
    this.createdAt = props.createdAt || new Date();
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

  public getPipelineId(): string {
    return this.pipelineId;
  }

  public getOrganizationId(): string {
    return this.organizationId;
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

  public getStatus(): CandidateStatus {
    return this.status;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
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
      startDate: project.startDate,
      endDate: project.endDate,
    }));
  }

  private static validateEducation(education: CandidateEducation[]): CandidateEducation[] {
    if (!Array.isArray(education) || education.length === 0) {
      throw new Error('Education records are required.');
    }
    return education.map(edu => ({
      institution: Candidate.requireNonEmpty(edu.institution, 'Institution is required.'),
      degree: Candidate.requireNonEmpty(edu.degree, 'Degree is required.'),
      fieldOfStudy: Candidate.requireNonEmpty(edu.fieldOfStudy, 'Field of study is required.'),
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
