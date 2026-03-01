import { prisma } from '../../infrastructure/database/prisma.client';
import { ScorecardAggregator, ConsensusDrivenStrategy } from './patterns/evaluation.strategy';

export class EvaluationService {
    async submitFeedback(data: { tenantId: string; candidateId: string; stageId: string; interviewerId: string; scores: any; recommendation: string }) {
        return await prisma.evaluation.create({
            data: {
                tenantId: data.tenantId,
                candidateId: data.candidateId,
                stageId: data.stageId,
                interviewerId: data.interviewerId,
                scores: data.scores,
                recommendation: data.recommendation,
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
}
