import { Response, NextFunction } from 'express';
import { EvaluationService } from './evaluation.service';
import { AppRequest } from '../../shared/middlewares/tenantContext.middleware';

const evaluationService = new EvaluationService();

export const submitFeedback = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const interviewerId = req.user!.id;
        const result = await evaluationService.submitFeedback({ ...req.body, tenantId, interviewerId });
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const listEvaluationsForCandidate = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const result = await evaluationService.listEvaluationsForCandidate(tenantId, req.params.candidateId as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const aggregateDecision = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const { candidateId } = req.params;
        const result = await evaluationService.aggregateDecision(tenantId, candidateId as string);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const getDecision = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const result = await evaluationService.getDecision(tenantId, req.params.candidateId as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
