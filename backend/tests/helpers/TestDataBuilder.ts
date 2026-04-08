import { randomUUID } from 'crypto';
import { Candidate } from '../../src/domain/entities/Candidate';
import type { CandidateProject } from '../../src/domain/entities/Candidate';
import { Evaluation } from '../../src/domain/entities/Evaluation';
import { Job } from '../../src/domain/entities/Job';
import { Resume } from '../../src/domain/entities/Resume';

export class TestDataBuilder {
  public static candidate(overrides: Partial<{
    id: string;
    name: string;
    email: string;
    phone: string;
    resumeId: string;
    skills: string[];
    yearsOfExperience: number;
    education: string;
    projects: CandidateProject[];
    status: 'active' | 'archived';
  }> = {}): Candidate {
    return new Candidate({
      id: overrides.id ?? randomUUID(),
      name: overrides.name ?? 'Jane Doe',
      email: overrides.email ?? 'jane.doe@example.com',
      phone: overrides.phone ?? '1234567890',
      resumeId: overrides.resumeId ?? randomUUID(),
      skills: overrides.skills ?? ['TypeScript', 'Node.js'],
      yearsOfExperience: overrides.yearsOfExperience ?? 4,
      education: overrides.education ?? 'B.Tech',
      projects:
        overrides.projects ??
        [
          {
            title: 'Platform Project',
            description: 'Built internal tooling.',
            technologies: ['TypeScript', 'Node.js'],
          },
        ],
      status: overrides.status ?? 'active',
    });
  }

  public static job(overrides: Partial<{
    id: string;
    title: string;
    department: string;
    description: string;
    requiredSkills: string[];
    preferredSkills: string[];
    requiredExperience: number;
    status: 'open' | 'closed';
  }> = {}): Job {
    return new Job({
      id: overrides.id ?? randomUUID(),
      title: overrides.title ?? 'Backend Engineer',
      department: overrides.department ?? 'Engineering',
      description: overrides.description ?? 'Build backend services',
      requiredSkills: overrides.requiredSkills ?? ['TypeScript', 'Node.js'],
      preferredSkills: overrides.preferredSkills ?? ['Docker'],
      requiredExperience: overrides.requiredExperience ?? 3,
      status: overrides.status ?? 'open',
    });
  }

  public static resume(overrides: Partial<{
    id: string;
    candidateId: string;
    fileName: string;
    rawText: string;
  }> = {}): Resume {
    return new Resume({
      id: overrides.id ?? randomUUID(),
      candidateId: overrides.candidateId ?? randomUUID(),
      fileName: overrides.fileName ?? 'resume.txt',
      rawText: overrides.rawText ?? 'Jane Doe\njane.doe@example.com\nTypeScript, Node.js',
      parsedData: {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        skills: ['TypeScript', 'Node.js'],
        experience: '4 years',
        education: 'B.Tech',
        projects: [{ title: 'Platform Project', description: 'Built internal tooling.' }],
      },
      uploadedAt: new Date(),
    });
  }

  public static evaluation(overrides: Partial<{
    id: string;
    candidateId: string;
    jobId: string;
    skillMatchScore: number;
    experienceScore: number;
    projectRelevanceScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendation: 'highly_recommended' | 'recommended' | 'consider' | 'not_recommended';
  }> = {}): Evaluation {
    return new Evaluation({
      id: overrides.id ?? randomUUID(),
      candidateId: overrides.candidateId ?? randomUUID(),
      jobId: overrides.jobId ?? randomUUID(),
      skillMatchScore: overrides.skillMatchScore ?? 90,
      experienceScore: overrides.experienceScore ?? 80,
      projectRelevanceScore: overrides.projectRelevanceScore ?? 85,
      strengths: overrides.strengths ?? ['Strong TypeScript'],
      weaknesses: overrides.weaknesses ?? ['Needs more cloud experience'],
      recommendation: overrides.recommendation ?? 'recommended',
      evaluatedAt: new Date(),
    });
  }
}
