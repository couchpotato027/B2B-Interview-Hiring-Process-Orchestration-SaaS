import { prisma } from '../../infrastructure/database/prisma.client';
import { NotFoundError } from '../../shared/errors/DomainErrors';

export class JobService {
    async createJob(tenantId: string, data: { title: string; department?: string; hiringManagerId?: string; pipelineTemplateId?: string }) {
        return prisma.job.create({
            data: {
                tenantId,
                title: data.title,
                department: data.department || '',
                hiringManagerId: data.hiringManagerId || null,
                pipelineTemplateId: data.pipelineTemplateId || null,
            },
            include: { pipelineTemplate: true, hiringManager: { select: { id: true, email: true, firstName: true, lastName: true } } },
        });
    }

    async listJobs(tenantId: string, status?: string) {
        return prisma.job.findMany({
            where: { tenantId, ...(status ? { status } : {}) },
            orderBy: { createdAt: 'desc' },
            include: {
                pipelineTemplate: { select: { id: true, name: true, roleType: true } },
                hiringManager: { select: { id: true, email: true, firstName: true, lastName: true } },
                _count: { select: { candidates: true } },
            },
        });
    }

    async getJob(tenantId: string, jobId: string) {
        const job = await prisma.job.findFirst({
            where: { id: jobId, tenantId },
            include: {
                pipelineTemplate: { include: { stages: { orderBy: { orderIndex: 'asc' } } } },
                hiringManager: { select: { id: true, email: true, firstName: true, lastName: true } },
                candidates: {
                    include: { currentStage: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!job) throw new NotFoundError('Job not found');
        return job;
    }

    async updateJob(tenantId: string, jobId: string, data: { title?: string; department?: string; hiringManagerId?: string; pipelineTemplateId?: string; status?: string }) {
        const job = await prisma.job.findFirst({ where: { id: jobId, tenantId } });
        if (!job) throw new NotFoundError('Job not found');

        return prisma.job.update({
            where: { id: jobId },
            data,
            include: { pipelineTemplate: true, hiringManager: { select: { id: true, email: true, firstName: true, lastName: true } } },
        });
    }

    async archiveJob(tenantId: string, jobId: string) {
        const job = await prisma.job.findFirst({ where: { id: jobId, tenantId } });
        if (!job) throw new NotFoundError('Job not found');

        return prisma.job.update({
            where: { id: jobId },
            data: { status: 'ARCHIVED' },
        });
    }
}
