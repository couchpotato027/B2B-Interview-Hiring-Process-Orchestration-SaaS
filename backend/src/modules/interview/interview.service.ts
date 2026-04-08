import { prisma } from '../../infrastructure/database/prisma.client';

export class InterviewService {
    async scheduleInterview(tenantId: string, data: { candidateId: string; stageId: string; interviewerId: string; scheduledAt: string; notes?: string }) {
        return prisma.interview.create({
            data: {
                tenantId,
                candidateId: data.candidateId,
                stageId: data.stageId,
                interviewerId: data.interviewerId,
                scheduledAt: new Date(data.scheduledAt),
                notes: data.notes || null,
            },
            include: {
                candidate: { select: { firstName: true, lastName: true, email: true } },
                stage: { select: { name: true } },
                interviewer: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
        });
    }

    async listInterviews(tenantId: string, filters?: { candidateId?: string; interviewerId?: string }) {
        return prisma.interview.findMany({
            where: {
                tenantId,
                ...(filters?.candidateId ? { candidateId: filters.candidateId } : {}),
                ...(filters?.interviewerId ? { interviewerId: filters.interviewerId } : {}),
            },
            orderBy: { scheduledAt: 'desc' },
            include: {
                candidate: { select: { firstName: true, lastName: true, email: true } },
                stage: { select: { name: true } },
                interviewer: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
        });
    }

    async updateInterview(tenantId: string, interviewId: string, data: { scheduledAt?: string; feedbackStatus?: string; notes?: string }) {
        const interview = await prisma.interview.findFirst({ where: { id: interviewId, tenantId } });
        if (!interview) throw { statusCode: 404, message: 'Interview not found' };

        return prisma.interview.update({
            where: { id: interviewId },
            data: {
                ...(data.scheduledAt ? { scheduledAt: new Date(data.scheduledAt) } : {}),
                ...(data.feedbackStatus ? { feedbackStatus: data.feedbackStatus } : {}),
                ...(data.notes !== undefined ? { notes: data.notes } : {}),
            },
            include: {
                candidate: { select: { firstName: true, lastName: true, email: true } },
                stage: { select: { name: true } },
                interviewer: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
        });
    }
}
