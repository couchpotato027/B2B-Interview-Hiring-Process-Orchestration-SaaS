import { Evaluation } from '@prisma/client';

export type HiringDecision = 'STRONG_HIRE' | 'HIRE' | 'NO_HIRE' | 'REQUIRES_DISCUSSION';

export interface IScoreAggregationStrategy {
    calculateFinalDecision(evaluations: Evaluation[]): HiringDecision;
    detectConflicts(evaluations: Evaluation[]): boolean;
}

export class ConsensusDrivenStrategy implements IScoreAggregationStrategy {
    calculateFinalDecision(evaluations: Evaluation[]): HiringDecision {
        if (evaluations.some(e => e.recommendation === 'NO_HIRE')) return 'NO_HIRE';

        const isStrongHire = evaluations.every(e => e.recommendation === 'STRONG_HIRE');
        if (isStrongHire) return 'STRONG_HIRE';

        return 'HIRE';
    }

    detectConflicts(evaluations: Evaluation[]): boolean {
        const hasStrongHire = evaluations.some(e => e.recommendation === 'STRONG_HIRE');
        const hasNoHire = evaluations.some(e => e.recommendation === 'NO_HIRE');

        // Conflict exists if one gave a STRONG_HIRE and another gave a NO_HIRE
        return hasStrongHire && hasNoHire;
    }
}

export class ScorecardAggregator {
    constructor(private strategy: IScoreAggregationStrategy) { }

    public setStrategy(strategy: IScoreAggregationStrategy) {
        this.strategy = strategy;
    }

    public aggregate(evaluations: Evaluation[]): { decision: HiringDecision, hasConflict: boolean } {
        return {
            decision: this.strategy.calculateFinalDecision(evaluations),
            hasConflict: this.strategy.detectConflicts(evaluations)
        };
    }
}
