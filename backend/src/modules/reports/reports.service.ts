import { prisma } from '../../infrastructure/database/prisma.client';

export class ReportsService {
    async getHiringFunnel(tenantId: string) {
        const stages = await prisma.pipelineStage.findMany({
            where: { tenantId },
            orderBy: { orderIndex: 'asc' },
            include: { _count: { select: { candidates: true } } },
        });

        return stages.map(s => ({
            stageName: s.name,
            count: s._count.candidates,
            orderIndex: s.orderIndex,
        }));
    }

    async getStageDropoff(tenantId: string) {
        const stages = await prisma.pipelineStage.findMany({
            where: { tenantId },
            orderBy: { orderIndex: 'asc' },
            include: { _count: { select: { candidates: true } } },
        });

        const data = stages.map((s, i) => {
            const current = s._count.candidates;
            const prevStage = i > 0 ? stages[i - 1] : null;
            const previous = prevStage ? prevStage._count.candidates : current;
            const dropoff = previous > 0 ? Math.round(((previous - current) / previous) * 100) : 0;
            return { stageName: s.name, candidates: current, dropoffRate: dropoff };
        });

        return data;
    }

    async getTimeToHireTrend(tenantId: string) {
        const hiredCandidates = await prisma.candidate.findMany({
            where: { tenantId, status: 'HIRED' },
            select: { createdAt: true, stageEnteredAt: true },
            orderBy: { stageEnteredAt: 'asc' },
        });

        // Group by month
        const monthMap: Record<string, number[]> = {};
        hiredCandidates.forEach(c => {
            const month = c.stageEnteredAt.toISOString().slice(0, 7); // YYYY-MM
            const days = Math.round((c.stageEnteredAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            if (!monthMap[month]) monthMap[month] = [];
            monthMap[month].push(days);
        });

        return Object.entries(monthMap).map(([month, days]) => ({
            month,
            avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
        }));
    }

    async getOfferAcceptanceRate(tenantId: string) {
        const [totalOffers, acceptedOffers] = await Promise.all([
            prisma.decision.count({ where: { tenantId } }),
            prisma.decision.count({ where: { tenantId, finalDecision: 'HIRE' } }),
        ]);

        return {
            totalOffers,
            acceptedOffers,
            rejectedOffers: totalOffers - acceptedOffers,
            acceptanceRate: totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : 0,
        };
    }
}
