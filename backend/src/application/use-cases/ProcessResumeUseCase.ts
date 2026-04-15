import { randomUUID } from 'crypto';
import { Candidate } from '../../domain/entities/Candidate';
import type { CandidateProject } from '../../domain/entities/Candidate';
import { Resume } from '../../domain/entities/Resume';
import type { ParsedResumeData } from '../../domain/entities/Resume';
import type { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import type { IResumeRepository } from '../../domain/repositories/IResumeRepository';
import type { IAIService } from '../../domain/services/IAIService';
import type {
  CandidateCreatedEvent,
  ResumeProcessedEvent,
} from '../../domain/events/DomainEvents';
import { EventEmitter } from '../../infrastructure/events/EventEmitter';
import { ResumeParsingService } from '../services/ResumeParsingService';
import { ResumeParserFactory } from '../../infrastructure/parsers/ResumeParserFactory';
import type { Result } from '../../shared/Result';

export interface ProcessResumeInput {
  file: Buffer;
  fileName: string;
  organizationId: string;
  candidateEmail?: string;
}

export interface ProcessResumeOutput {
  candidate: Candidate;
  resume: Resume;
}

export interface ProcessResumeDependencies {
  candidateRepository: ICandidateRepository;
  resumeRepository: IResumeRepository;
  aiService: IAIService;
  resumeParserFactory?: ResumeParserFactory;
  resumeParsingService?: ResumeParsingService;
  eventEmitter?: EventEmitter;
}

export class ProcessResumeUseCase {
  private readonly resumeParserFactory: ResumeParserFactory;
  private readonly eventEmitter: EventEmitter;
  private readonly resumeParsingService: ResumeParsingService;

  constructor(private readonly dependencies: ProcessResumeDependencies) {
    this.resumeParserFactory = dependencies.resumeParserFactory ?? new ResumeParserFactory();
    this.resumeParsingService =
      dependencies.resumeParsingService ??
      new ResumeParsingService(this.resumeParserFactory);
    this.eventEmitter = dependencies.eventEmitter ?? EventEmitter.getInstance();
  }

  public async execute(input: ProcessResumeInput): Promise<Result<ProcessResumeOutput>> {
    try {
      const parsedResumeData = await this.resumeParsingService.parseResume(input.file, input.fileName);
      const rawResumeText = this.buildResumeText(parsedResumeData);
      const aiSkills = await this.dependencies.aiService.extractSkillsFromResume(rawResumeText);
      const mergedSkills = this.mergeSkills(parsedResumeData.skills ?? [], aiSkills);
      const resolvedEmail = input.candidateEmail?.trim() || parsedResumeData.email?.trim();

      if (!resolvedEmail) {
        return {
          success: false,
          error: 'Candidate email is required to process a resume.',
          code: 'MISSING_CANDIDATE_EMAIL',
        };
      }

      const existingCandidate = await this.dependencies.candidateRepository.findByEmail(resolvedEmail, input.organizationId);
      const candidate = existingCandidate
        ? this.buildUpdatedCandidate(existingCandidate, parsedResumeData, mergedSkills, resolvedEmail, input.organizationId)
        : this.buildNewCandidate(parsedResumeData, mergedSkills, resolvedEmail, input.organizationId);

      const savedCandidate = existingCandidate
        ? await this.dependencies.candidateRepository.update(existingCandidate.getId(), candidate, input.organizationId)
        : await this.dependencies.candidateRepository.save(candidate);

      const resume = new Resume({
        id: randomUUID(),
        candidateId: savedCandidate.getId(),
        fileName: input.fileName,
        rawText: rawResumeText,
        parsedData: {
          ...parsedResumeData,
          email: resolvedEmail,
          skills: mergedSkills,
        },
        uploadedAt: new Date(),
        organizationId: input.organizationId,
      });

      const savedResume = await this.dependencies.resumeRepository.save(resume);

      if (!existingCandidate) {
        const candidateCreatedEvent: CandidateCreatedEvent = {
          eventType: 'CandidateCreatedEvent',
          timestamp: new Date(),
          payload: {
            candidateId: savedCandidate.getId(),
            organizationId: input.organizationId,
            name: savedCandidate.getName(),
            email: savedCandidate.getEmail(),
            timestamp: new Date(),
          },
        };

        await this.eventEmitter.emit(candidateCreatedEvent);
      }

      const resumeProcessedEvent: ResumeProcessedEvent = {
        eventType: 'ResumeProcessedEvent',
        timestamp: new Date(),
        payload: {
          candidateId: savedCandidate.getId(),
          resumeId: savedResume.getId(),
          organizationId: input.organizationId,
          timestamp: new Date(),
        },
      };

      await this.eventEmitter.emit(resumeProcessedEvent);

      return {
        success: true,
        data: {
          candidate: savedCandidate,
          resume: savedResume,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown resume processing failure.';
      const code = /No resume parser available/i.test(message)
        ? 'INVALID_FILE_FORMAT'
        : 'RESUME_PROCESSING_FAILED';

      return {
        success: false,
        error: message,
        code,
      };
    }
  }

  private buildNewCandidate(
    parsedResumeData: ParsedResumeData,
    skills: string[],
    email: string,
    organizationId: string,
  ): Candidate {
    return new Candidate({
      id: randomUUID(),
      pipelineId: 'default-pipeline',
      name: parsedResumeData.name?.trim() || this.getNameFromEmail(email),
      email,
      phone: parsedResumeData.phone?.trim() || 'Not provided',
      organizationId,
      resumeId: randomUUID(),
      skills,
      yearsOfExperience: this.parseYearsOfExperience(parsedResumeData.experience),
      education: parsedResumeData.education?.trim() || 'Not specified',
      projects: this.mapProjects(parsedResumeData.projects),
      status: 'active',
    });
  }

  private buildUpdatedCandidate(
    existingCandidate: Candidate,
    parsedResumeData: ParsedResumeData,
    skills: string[],
    email: string,
    organizationId: string,
  ): Candidate {
    return new Candidate({
      id: existingCandidate.getId(),
      pipelineId: existingCandidate.getPipelineId(),
      name: parsedResumeData.name?.trim() || existingCandidate.getName(),
      email,
      phone: parsedResumeData.phone?.trim() || existingCandidate.getPhone(),
      organizationId,
      resumeId: existingCandidate.getResumeId(),
      skills: this.mergeSkills(existingCandidate.getSkills(), skills),
      yearsOfExperience: Math.max(
        existingCandidate.getYearsOfExperience(),
        this.parseYearsOfExperience(parsedResumeData.experience),
      ),
      education: parsedResumeData.education?.trim() || existingCandidate.getEducation(),
      projects: this.mergeProjects(existingCandidate.getProjects(), parsedResumeData.projects),
      status: existingCandidate.getStatus(),
    });
  }

  private parseYearsOfExperience(experience: string | undefined): number {
    if (!experience) {
      return 0;
    }

    const match = experience.match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : 0;
  }

  private mapProjects(projects: ParsedResumeData['projects'] | undefined): CandidateProject[] {
    return (projects ?? []).map((project) => ({
      title: project.title,
      description: project.description,
      technologies: project.technologies ?? [],
    }));
  }

  private mergeProjects(
    existingProjects: CandidateProject[],
    parsedProjects: ParsedResumeData['projects'] | undefined,
  ): CandidateProject[] {
    const projectMap = new Map<string, CandidateProject>();

    for (const project of existingProjects) {
      projectMap.set(project.title.toLowerCase(), project);
    }

    for (const project of parsedProjects ?? []) {
      if (!projectMap.has(project.title.toLowerCase())) {
        projectMap.set(project.title.toLowerCase(), {
          title: project.title,
          description: project.description,
          technologies: project.technologies ?? [],
        });
      }
    }

    return Array.from(projectMap.values());
  }

  private mergeSkills(baseSkills: string[], aiSkills: string[]): string[] {
    return [...new Set([...baseSkills, ...aiSkills].map((skill) => skill.trim()).filter(Boolean))];
  }

  private getNameFromEmail(email: string): string {
    const localPart = email.split('@')[0] ?? 'Candidate';
    return localPart
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private buildResumeText(parsedResumeData: ParsedResumeData): string {
    return [
      parsedResumeData.name,
      parsedResumeData.email,
      parsedResumeData.phone,
      parsedResumeData.skills?.join(', '),
      parsedResumeData.experience,
      parsedResumeData.education,
      parsedResumeData.projects
        ?.map((project) => `${project.title}: ${project.description}`)
        .join('\n'),
    ]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join('\n');
  }
}
