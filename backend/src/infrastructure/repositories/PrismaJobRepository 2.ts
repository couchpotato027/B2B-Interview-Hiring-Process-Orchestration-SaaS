import { PrismaClient } from '@prisma/client';
import { Job, JobStatus } from '../../domain/entities/Job';
import { IJobRepository } from '../../domain/repositories/IJobRepository';
import { prisma } from '../database/prisma.client';

export class PrismaJobRepository implements IJobRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findById(id: string, organizationId: string): Promise<Job | null> {
    const model = await this.prisma.job.findFirst({
      where: { id, tenantId: organizationId },
      include: {
        _count: {
          select: { candidates: true }
        }
      }
    });
    return model ? this.mapToEntity(model) : null;
  }

  async findAll(organizationId: string): Promise<Job[]> {
    const models = await this.prisma.job.findMany({
      where: { tenantId: organizationId },
      include: {
        _count: {
          select: { candidates: true }
        }
      }
    });
    return models.map(this.mapToEntity);
  }

  async save(job: Job): Promise<Job> {
    const data = {
      id: job.getId(),
      title: job.getTitle(),
      tenantId: job.getOrganizationId(),
      status: job.getStatus().toUpperCase(),
      department: job.getDepartment() || 'General',
      description: job.getDescription() || '',
    };

    const saved = await this.prisma.job.upsert({
      where: { id: job.getId() },
      create: data,
      update: data,
    });

    return this.mapToEntity(saved);
  }

  async update(id: string, job: Job, organizationId: string): Promise<Job> {
    const data = {
      title: job.getTitle(),
      status: job.getStatus().toUpperCase(),
      department: job.getDepartment(),
      description: job.getDescription(),
    };

    const updated = await this.prisma.job.update({
      where: { id, tenantId: organizationId },
      data,
    });

    return this.mapToEntity(updated);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.job.delete({
      where: { id, tenantId: organizationId },
    });
  }

  async findByStatus(status: JobStatus, organizationId: string): Promise<Job[]> {
    const models = await this.prisma.job.findMany({
      where: { tenantId: organizationId, status: status.toUpperCase() },
      include: {
        _count: {
          select: { candidates: true }
        }
      }
    });
    return models.map(this.mapToEntity);
  }

  async findByOrganizationId(organizationId: string): Promise<Job[]> {
    return this.findAll(organizationId);
  }

  private mapToEntity(model: any): Job {
    const job = new Job({
      id: model.id,
      organizationId: model.tenantId,
      title: model.title,
      department: model.department || 'General',
      description: model.description || 'Job Description',
      requiredSkills: ['Software Engineering'], // Satisfy strict Job domain entity
      preferredSkills: [],
      requiredExperience: 0,
      status: model.status.toLowerCase() as JobStatus,
    });
    
    // Attach count for transformer
    (job as any).candidateCount = model._count?.candidates || 0;
    
    return job;
  }
}
