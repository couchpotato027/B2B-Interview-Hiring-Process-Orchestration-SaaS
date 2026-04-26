import { Candidate } from '../../domain/entities/Candidate';
import { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { IJobRepository } from '../../domain/repositories/IJobRepository';
import { IPipelineRepository } from '../../domain/repositories/IPipelineRepository';
import { ResumeParsingService } from '../services/ResumeParsingService';
import { EventEmitter } from '../../infrastructure/events/EventEmitter';
import { Result } from '../../shared/Result';
import { ParsedResumeData } from '../../domain/entities/Resume';
import { randomUUID } from 'crypto';
import { prisma } from '../../infrastructure/database/prisma.client';

export interface ProcessResumeInput {
  file: Buffer;
  fileName: string;
  organizationId: string;
  resumeUrl?: string;
  jobId?: string;
  pipelineId?: string;
}

export interface ProcessResumeDependencies {
  candidateRepository: ICandidateRepository;
  jobRepository: IJobRepository;
  pipelineRepository: IPipelineRepository;
  resumeParsingService: ResumeParsingService;
}

export class ProcessResumeUseCase {
  constructor(
    private readonly dependencies: ProcessResumeDependencies,
    private readonly eventEmitter: EventEmitter = EventEmitter.getInstance()
  ) {}

  async execute(input: ProcessResumeInput): Promise<Result<Candidate>> {
    try {
      console.log(`[ResumeProcess] Starting for file: ${input.fileName}`);
      
      // 1. AI Parse
      console.log(`[ResumeProcess] Calling AI Parser...`);
      const parsedResumeData = await this.dependencies.resumeParsingService.parseResume(input.file, input.fileName);
      console.log(`[ResumeProcess] AI Parsed: ${parsedResumeData.name}`);
      
      // 2. Get Skills for comparison
      const job = input.jobId ? await this.dependencies.jobRepository.findById(input.jobId, input.organizationId) : null;
      const mergedSkills = this.mergeSkills(job?.getRequiredSkills() || [], parsedResumeData.skills || []);

      // 3. Resolve Email
      const resolvedEmail = parsedResumeData.email || `imported-${Date.now()}@hireflow.internal`;

      // 4. Get Pipeline context
      let pipelineId = input.pipelineId || (job ? job.getPipelineTemplateId() : undefined);
      let firstStageId: string | undefined;

      if (!pipelineId) {
        console.log(`[ResumeProcess] No pipeline provided, fetching default...`);
        const defaultPipeline = await prisma.pipelineTemplate.findFirst({
          where: { tenantId: input.organizationId, isActive: true },
          include: { stages: { orderBy: { orderIndex: 'asc' }, take: 1 } }
        });
        if (defaultPipeline) {
          pipelineId = defaultPipeline.id;
          firstStageId = defaultPipeline.stages[0]?.id;
        }
      } else {
        const pipeline = await this.dependencies.pipelineRepository.findById(pipelineId, input.organizationId);
        if (pipeline) {
          const stages = pipeline.getStages();
          firstStageId = stages[0]?.getId();
        }
      }

      if (!pipelineId || !firstStageId) {
          return { success: false, error: 'No valid pipeline or stage found for candidate placement', code: 'PIPELINE_NOT_FOUND' };
      }

      // 5. Check for existing candidate by email
      console.log(`[ResumeProcess] Saving candidate...`);
      const existingCandidate = await this.dependencies.candidateRepository.findByEmail(resolvedEmail, input.organizationId);
      
      const candidate = existingCandidate
        ? this.buildUpdatedCandidate(existingCandidate, parsedResumeData, mergedSkills, resolvedEmail, input.organizationId, input.resumeUrl, pipelineId, firstStageId, input.jobId)
        : this.buildNewCandidate(parsedResumeData, mergedSkills, resolvedEmail, input.organizationId, input.resumeUrl, pipelineId, firstStageId, input.jobId);

      // 6. Initialize timeline if new
      if (!existingCandidate) {
        candidate.setStageHistory([{
          action: 'ENTERED_STAGE',
          stageId: firstStageId,
          at: new Date().toISOString(),
          by: 'System (AI Processed)'
        }]);
      }

      // 7. Save the candidate
      await this.dependencies.candidateRepository.save(candidate);
      console.log(`[ResumeProcess] Candidate saved successfully: ${candidate.getId()}`);

      // 8. Emit Domain Event
      await this.eventEmitter.emit({
        eventType: 'CandidateCreatedEvent',
        timestamp: new Date(),
        payload: {
          candidateId: candidate.getId(),
          organizationId: input.organizationId,
          jobId: input.jobId,
          email: candidate.getEmail()
        }
      });

      return { success: true, data: candidate };
    } catch (error: any) {
      console.error('[ResumeProcess] CRITICAL ERROR:', error);
      const isFormatError = error.message && error.message.includes('Invalid or corrupted');
      return { 
        success: false, 
        error: error.message, 
        code: isFormatError ? 'INVALID_FILE_FORMAT' : 'INTERNAL_ERROR' 
      };
    }
  }

  private mergeSkills(jobSkills: string[], resumeSkills: string[]): string[] {
    const sanitize = (s: any) => typeof s === 'string' ? s.toLowerCase().trim() : '';
    const all = new Set([
      ...jobSkills.map(sanitize).filter(Boolean),
      ...resumeSkills.map(sanitize).filter(Boolean)
    ]);
    return Array.from(all);
  }

  private buildNewCandidate(
    parsedResumeData: ParsedResumeData,
    mergedSkills: string[],
    email: string,
    organizationId: string,
    resumeUrl?: string,
    pipelineId?: string,
    currentStageId?: string,
    jobId?: string
  ): Candidate {
    return new Candidate({
      id: randomUUID(),
      name: parsedResumeData.name?.trim() || 'Imported Candidate',
      email,
      phone: parsedResumeData.phone?.trim() || 'N/A',
      summary: parsedResumeData.summary?.trim() || '',
      organizationId,
      pipelineId: pipelineId || '',
      currentStageId: currentStageId || '',
      jobId: jobId || undefined,
      resumeId: randomUUID(),
      resumeUrl: resumeUrl,
      skills: mergedSkills,
      yearsOfExperience: this.parseYearsOfExperience(parsedResumeData.experience),
      education: [{ institution: 'Extracted', degree: parsedResumeData.education?.trim() || 'Not specified', fieldOfStudy: 'N/A' }],
      projects: this.mapProjects(parsedResumeData.projects),
      status: 'active',
      score: parsedResumeData.score || 0,
    });
  }

  private buildUpdatedCandidate(
    existingCandidate: Candidate,
    parsedResumeData: ParsedResumeData,
    skills: string[],
    email: string,
    organizationId: string,
    resumeUrl?: string,
    pipelineId?: string,
    currentStageId?: string,
    jobId?: string
  ): Candidate {
    return new Candidate({
      id: existingCandidate.getId(),
      pipelineId: pipelineId || existingCandidate.getPipelineId(),
      currentStageId: currentStageId || existingCandidate.getCurrentStageId(),
      jobId: jobId || existingCandidate.getJobId() || undefined,
      name: parsedResumeData.name?.trim() || existingCandidate.getName(),
      email,
      phone: parsedResumeData.phone?.trim() || existingCandidate.getPhone(),
      summary: parsedResumeData.summary?.trim() || existingCandidate.getSummary(),
      organizationId,
      resumeId: existingCandidate.getResumeId(),
      resumeUrl: resumeUrl || existingCandidate.getResumeUrl(),
      skills: this.mergeSkills(existingCandidate.getSkills(), skills),
      yearsOfExperience: Math.max(
        existingCandidate.getYearsOfExperience(),
        this.parseYearsOfExperience(parsedResumeData.experience)
      ),
      education: existingCandidate.getEducation(),
      projects: existingCandidate.getProjects(),
      status: existingCandidate.getStatus(),
      stageHistory: existingCandidate.getStageHistory(),
      createdAt: existingCandidate.getCreatedAt(),
      score: parsedResumeData.score || existingCandidate.getScore(),
    });
  }

  private parseYearsOfExperience(exp?: string): number {
    if (!exp) return 0;
    const match = exp.match(/(\d+)/);
    return match ? parseInt(match[1] || '0') : 0;
  }

  private mapProjects(projects?: any[]): any[] {
    if (!projects) return [];
    return projects.map(p => ({
      title: typeof p === 'string' ? p : p.title || 'Untitled Project',
      description: typeof p === 'string' ? '' : p.description || '',
      technologies: [],
    }));
  }
}
