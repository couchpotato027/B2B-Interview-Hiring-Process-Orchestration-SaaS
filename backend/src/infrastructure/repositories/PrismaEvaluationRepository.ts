import { PrismaClient } from '@prisma/client';
import { Evaluation, EvaluationRecommendation } from '../../domain/entities/Evaluation';
import { IEvaluationRepository } from '../../domain/repositories/IEvaluationRepository';
import { prisma } from '../database/prisma.client';

export class PrismaEvaluationRepository implements IEvaluationRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findById(id: string, organizationId: string): Promise<Evaluation | null> {
    const model = await this.prisma.evaluation.findFirst({
      where: { id, tenantId: organizationId },
    });
    return model ? this.mapToEntity(model) : null;
  }

  async findAll(organizationId: string): Promise<Evaluation[]> {
    const models = await this.prisma.evaluation.findMany({
      where: { tenantId: organizationId },
    });
    return models.map(m => this.mapToEntity(m));
  }

  async save(evaluation: Evaluation): Promise<Evaluation> {
    const data = {
      id: evaluation.getId(),
      tenantId: evaluation.getOrganizationId(),
      candidateId: evaluation.getCandidateId(),
      jobId: evaluation.getJobId(),
      skillMatchScore: evaluation.getSkillMatchScore(),
      experienceScore: evaluation.getExperienceScore(),
      projectRelevanceScore: evaluation.getProjectRelevanceScore(),
      overallScore: evaluation.getOverallScore(),
      strengths: evaluation.getStrengths(),
      weaknesses: evaluation.getWeaknesses(),
      missingSkills: evaluation.getMissingSkills(),
      recommendation: evaluation.getRecommendation(),
      evaluatedAt: evaluation.getEvaluatedAt(),
    };

    const saved = await this.prisma.evaluation.upsert({
      where: { id: evaluation.getId() },
      create: data,
      update: data,
    });

    return this.mapToEntity(saved);
  }

  async update(id: string, evaluation: Evaluation, organizationId: string): Promise<Evaluation> {
    return this.save(evaluation);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.evaluation.delete({
      where: { id },
    });
  }

  async findByJobId(jobId: string, organizationId: string): Promise<Evaluation[]> {
    const models = await this.prisma.evaluation.findMany({
      where: { jobId, tenantId: organizationId },
    });
    return models.map(m => this.mapToEntity(m));
  }

  async findByCandidateId(candidateId: string, organizationId: string): Promise<Evaluation[]> {
    const models = await this.prisma.evaluation.findMany({
      where: { candidateId, tenantId: organizationId },
    });
    return models.map(m => this.mapToEntity(m));
  }

  async findByCandidateAndJob(candidateId: string, jobId: string, organizationId: string): Promise<Evaluation | null> {
    const model = await this.prisma.evaluation.findFirst({
      where: { candidateId, jobId, tenantId: organizationId },
    });
    return model ? this.mapToEntity(model) : null;
  }

  private mapToEntity(model: any): Evaluation {
    return new Evaluation({
      id: model.id,
      candidateId: model.candidateId,
      jobId: model.jobId,
      skillMatchScore: model.skillMatchScore,
      experienceScore: model.experienceScore,
      projectRelevanceScore: model.projectRelevanceScore,
      overallScore: model.overallScore,
      strengths: model.strengths,
      weaknesses: model.weaknesses,
      missingSkills: model.missingSkills,
      recommendation: model.recommendation as EvaluationRecommendation,
      summary: '', // We don't store summary in DB for now to keep it simple, or we can add it
      organizationId: model.tenantId,
      evaluatedAt: model.evaluatedAt,
    });
  }
}
