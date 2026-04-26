import { PrismaClient } from '@prisma/client';
import { Candidate, CandidateStatus } from '../../domain/entities/Candidate';
import { ICandidateRepository, CandidateFilters } from '../../domain/repositories/ICandidateRepository';
import { PaginatedResult } from '../../domain/types/Pagination';
import { prisma } from '../database/prisma.client';

export class PrismaCandidateRepository implements ICandidateRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findById(id: string, organizationId: string): Promise<Candidate | null> {
    const model = await this.prisma.candidate.findFirst({
      where: { id, tenantId: organizationId },
    });
    return model ? this.mapToEntity(model) : null;
  }

  async findAll(organizationId: string): Promise<Candidate[]> {
    const models = await this.prisma.candidate.findMany({
      where: { tenantId: organizationId },
    });
    return models.map(m => this.mapToEntity(m));
  }

  async save(candidate: Candidate): Promise<Candidate> {
    const data = {
      id: candidate.getId(),
      firstName: candidate.getName().split(' ')[0] || '',
      lastName: candidate.getName().split(' ').slice(1).join(' ') || '',
      email: candidate.getEmail(),
      tenantId: candidate.getOrganizationId(),
      pipelineId: candidate.getPipelineId(),
      currentStageId: candidate.getCurrentStageId() || null,
      status: candidate.getStatus().toUpperCase(),
      skills: candidate.getSkills(),
      yearsOfExperience: candidate.getYearsOfExperience(),
      education: candidate.getEducation() as any,
      projects: candidate.getProjects() as any,
      jobId: candidate.getJobId() || null,
      resumeUrl: candidate.getResumeUrl() || null,
      phone: candidate.getPhone(),
      summary: candidate.getSummary(),
      stageHistory: candidate.getStageHistory() as any,
      assignedRecruiterId: candidate.getAssignedRecruiterId() || null,
      score: candidate.getScore(),
    };

    const saved = await this.prisma.candidate.upsert({
      where: { id: candidate.getId() },
      create: data,
      update: data,
    });

    return this.mapToEntity(saved);
  }

  async update(id: string, candidate: Candidate, organizationId: string): Promise<Candidate> {
    const data = {
      firstName: candidate.getName().split(' ')[0] || '',
      lastName: candidate.getName().split(' ').slice(1).join(' ') || '',
      email: candidate.getEmail(),
      status: candidate.getStatus().toUpperCase(),
      skills: candidate.getSkills(),
      yearsOfExperience: candidate.getYearsOfExperience(),
      education: candidate.getEducation() as any,
      projects: candidate.getProjects() as any,
      phone: candidate.getPhone(),
      summary: candidate.getSummary(),
      stageHistory: candidate.getStageHistory() as any,
      assignedRecruiterId: candidate.getAssignedRecruiterId() || null,
      score: candidate.getScore(),
    };

    const updated = await this.prisma.candidate.update({
      where: { id },
      data,
    });

    return this.mapToEntity(updated);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.candidate.delete({
      where: { id },
    });
  }

  async findByEmail(email: string, organizationId: string): Promise<Candidate | null> {
    const model = await this.prisma.candidate.findFirst({
      where: { email, tenantId: organizationId },
    });
    return model ? this.mapToEntity(model) : null;
  }

  async findWithFilters(filters: CandidateFilters, organizationId: string): Promise<PaginatedResult<Candidate>> {
    const { page = 1, limit = 10, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: organizationId,
      ...(status && { status: status.toUpperCase() }),
    };

    if (filters.assignedToUserId) {
        where.interviews = {
            some: {
                panel: { some: { userId: filters.assignedToUserId } }
            }
        };
    }

    const [items, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.candidate.count({ where }),
    ]);

    return {
      items: items.map(m => this.mapToEntity(m)),
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  private mapToEntity(model: any): Candidate {
    return new Candidate({
      id: model.id,
      name: `${model.firstName} ${model.lastName}`.trim(),
      email: model.email,
      phone: model.phone || '',
      summary: model.summary || '',
      organizationId: model.tenantId,
      pipelineId: model.pipelineId,
      currentStageId: model.currentStageId,
      jobId: model.jobId,
      resumeUrl: model.resumeUrl,
      resumeId: model.resumeUrl || 'NONE',
      skills: model.skills || [],
      yearsOfExperience: model.yearsOfExperience || 0,
      education: (model.education as any) || [],
      projects: (model.projects as any) || [],
      status: model.status.toLowerCase() as CandidateStatus,
      createdAt: model.createdAt,
      stageHistory: (model.stageHistory as any) || [],
      assignedRecruiterId: model.assignedRecruiterId || undefined,
      score: model.score || 0,
    });
  }
}
