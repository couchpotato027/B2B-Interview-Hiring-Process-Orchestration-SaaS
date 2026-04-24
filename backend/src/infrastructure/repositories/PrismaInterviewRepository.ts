import { PrismaClient } from '@prisma/client';
import { Interview, InterviewPanelMember, InterviewFeedback } from '../../domain/entities/Interview';
import { IInterviewRepository } from '../../domain/repositories/IInterviewRepository';
import { prisma } from '../database/prisma.client';

export class PrismaInterviewRepository implements IInterviewRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findById(id: string, tenantId: string): Promise<Interview | null> {
    const model = await this.prisma.interview.findFirst({
      where: { id, tenantId },
      include: { panel: true }
    });
    return model ? this.mapToEntity(model) : null;
  }

  async findByCandidateId(candidateId: string, tenantId: string): Promise<Interview[]> {
    const models = await this.prisma.interview.findMany({
      where: { candidateId, tenantId },
      include: { panel: true },
      orderBy: { scheduledAt: 'desc' }
    });
    return models.map(this.mapToEntity);
  }

  async findByInterviewerId(userId: string, tenantId: string): Promise<Interview[]> {
    const models = await this.prisma.interview.findMany({
      where: { 
        tenantId,
        panel: { some: { userId } }
      },
      include: { panel: true },
      orderBy: { scheduledAt: 'asc' }
    });
    return models.map(this.mapToEntity);
  }

  async findAvailabilityConflicts(userIds: string[], start: Date, end: Date, tenantId: string): Promise<Interview[]> {
    // Check for interviews that overlap with the given time range
    const models = await this.prisma.interview.findMany({
      where: {
        tenantId,
        status: { in: ['SCHEDULED', 'RESCHEDULED'] },
        panel: { some: { userId: { in: userIds } } },
        OR: [
          {
            // Existing interview starts during requested range
            scheduledAt: { gte: start, lt: end }
          },
          {
            // Existing interview ends during requested range
            // We approximate end time using scheduledAt + duration
            // For a robust check, database-level interval logic is better, but here we'll filter in JS if needed
            // or just use direct overlaps.
          }
        ]
      },
      include: { panel: true }
    });
    
    // More accurate overlap check in JS since duration is a column
    return models.filter(m => {
        const mStart = new Date(m.scheduledAt).getTime();
        const mEnd = mStart + (m.duration * 60000);
        const reqStart = start.getTime();
        const reqEnd = end.getTime();
        return (mStart < reqEnd && mEnd > reqStart);
    }).map(this.mapToEntity);
  }

  async save(interview: Interview): Promise<Interview> {
    const panelMembers = interview.getPanel();
    
    const saved = await this.prisma.interview.create({
      data: {
        id: interview.getId(),
        tenantId: interview.getTenantId(),
        candidateId: interview.getCandidateId(),
        stageId: interview.getStageId(),
        title: interview.getTitle(),
        type: interview.getType().toUpperCase(),
        status: interview.getStatus().toUpperCase(),
        scheduledAt: interview.getScheduledAt(),
        duration: interview.getDuration(),
        videoLink: interview.getVideoLink(),
        notes: interview.getNotes(),
        feedback: interview.getFeedback() as any,
        feedbackStatus: interview.getFeedback() ? 'SUBMITTED' : 'PENDING',
        panel: {
          create: panelMembers.map(m => ({
            userId: m.userId,
            role: m.role.toUpperCase()
          }))
        }
      },
      include: { panel: true }
    });

    return this.mapToEntity(saved);
  }

  async update(interview: Interview): Promise<Interview> {
    // For update, we might need to sync panel members
    // For simplicity, we delete and recreate panel if modified, but here we'll just update main fields
    const saved = await this.prisma.interview.update({
      where: { id: interview.getId() },
      data: {
        title: interview.getTitle(),
        type: interview.getType().toUpperCase(),
        status: interview.getStatus().toUpperCase(),
        scheduledAt: interview.getScheduledAt(),
        duration: interview.getDuration(),
        videoLink: interview.getVideoLink(),
        notes: interview.getNotes(),
        feedback: interview.getFeedback() as any,
        feedbackStatus: interview.getFeedback() ? 'SUBMITTED' : 'PENDING',
      },
      include: { panel: true }
    });

    return this.mapToEntity(saved);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.interview.delete({
      where: { id, tenantId }
    });
  }

  private mapToEntity(model: any): Interview {
    return new Interview({
      id: model.id,
      tenantId: model.tenantId,
      candidateId: model.candidateId,
      stageId: model.stageId,
      title: model.title,
      type: model.type.toLowerCase() as any,
      status: model.status.toLowerCase() as any,
      scheduledAt: model.scheduledAt,
      duration: model.duration,
      videoLink: model.videoLink,
      notes: model.notes,
      panel: model.panel.map((p: any) => ({
        userId: p.userId,
        role: p.role.toLowerCase() as any
      })),
      feedback: model.feedback as any,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    });
  }
}
