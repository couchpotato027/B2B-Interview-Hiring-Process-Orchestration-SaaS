import { prisma } from '../../infrastructure/database/prisma.client';
import { ScorecardAggregator, ConsensusDrivenStrategy } from './patterns/evaluation.strategy';

export class EvaluationService {
    async submitFeedback(data: { tenantId: string; candidateId: string; stageId: string; interviewerId: string; scores: any; recommendation: string }) {
        const evaluation = await prisma.evaluation.create({
            data: {
                tenantId: data.tenantId,
                candidateId: data.candidateId,
                stageId: data.stageId,
                interviewerId: data.interviewerId,
                scores: data.scores,
                recommendation: data.recommendation,
            },
            include: {
                interviewer: { select: { firstName: true, lastName: true, email: true } },
                stage: { select: { name: true } },
                candidate: { select: { firstName: true, lastName: true } },
            },
        });

        // Mark related interview as SUBMITTED
        await prisma.interview.updateMany({
            where: {
                tenantId: data.tenantId,
                candidateId: data.candidateId,
                stageId: data.stageId,
                interviewerId: data.interviewerId,
                feedbackStatus: 'PENDING',
            },
            data: { feedbackStatus: 'SUBMITTED' },
        });

        return evaluation;
    }

    async listEvaluationsForCandidate(tenantId: string, candidateId: string) {
        return prisma.evaluation.findMany({
            where: { tenantId, candidateId },
            orderBy: { createdAt: 'desc' },
            include: {
                interviewer: { select: { firstName: true, lastName: true, email: true } },
                stage: { select: { name: true } },
            },
        });
    }

    async aggregateDecision(tenantId: string, candidateId: string) {
        const evaluations = await prisma.evaluation.findMany({
            where: { tenantId, candidateId },
        });

        if (evaluations.length === 0) throw new Error('No evaluations found');

        // Strategy Pattern usage
        const aggregator = new ScorecardAggregator(new ConsensusDrivenStrategy());
        const result = aggregator.aggregate(evaluations);

        const decision = await prisma.decision.create({
            data: {
                tenantId,
                candidateId,
                finalDecision: result.decision,
                hasConflict: result.hasConflict,
            },
        });

        return decision;
    }

    async getDecision(tenantId: string, candidateId: string) {
        return prisma.decision.findFirst({
            where: { tenantId, candidateId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
