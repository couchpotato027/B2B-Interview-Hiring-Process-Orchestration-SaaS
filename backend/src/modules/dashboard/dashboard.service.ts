import { prisma } from '../../infrastructure/database/prisma.client';

export class DashboardService {
    async getStats(tenantId: string) {
        const [activeCandidates, totalHired, pendingAlerts, offersAccepted, avgTimeToHire] = await Promise.all([
            prisma.candidate.count({ where: { tenantId, status: { notIn: ['HIRED', 'REJECTED'] } } }),
            prisma.candidate.count({ where: { tenantId, status: 'HIRED' } }),
            prisma.slaAlert.count({ where: { tenantId, isResolved: false } }),
            prisma.decision.count({ where: { tenantId, finalDecision: 'HIRE' } }),
            this.calculateAvgTimeToHire(tenantId),
        ]);

        return {
            activeCandidates,
            totalHired,
            pendingAlerts,
            offersAccepted,
            avgTimeToHireDays: avgTimeToHire,
        };
    }

    private async calculateAvgTimeToHire(tenantId: string): Promise<number> {
        const hiredCandidates = await prisma.candidate.findMany({
            where: { tenantId, status: 'HIRED' },
            select: { createdAt: true, stageEnteredAt: true },
        });
        if (hiredCandidates.length === 0) return 0;

        const totalDays = hiredCandidates.reduce((sum, c) => {
            const diff = c.stageEnteredAt.getTime() - c.createdAt.getTime();
            return sum + diff / (1000 * 60 * 60 * 24);
        }, 0);
        return Math.round(totalDays / hiredCandidates.length);
    }

    async getRecentAlerts(tenantId: string) {
        return prisma.slaAlert.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                candidate: { select: { firstName: true, lastName: true, email: true } },
            },
        });
    }

    async getPendingEvaluations(tenantId: string) {
        return prisma.interview.findMany({
            where: { tenantId, feedbackStatus: 'PENDING' },
            orderBy: { scheduledAt: 'asc' },
            take: 20,
            include: {
                candidate: { select: { firstName: true, lastName: true, email: true } },
                stage: { select: { name: true } },
                interviewer: { select: { firstName: true, lastName: true, email: true } },
            },
        });
    }
}
