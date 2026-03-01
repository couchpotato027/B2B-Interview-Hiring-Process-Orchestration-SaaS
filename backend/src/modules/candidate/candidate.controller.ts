import { Response, NextFunction } from 'express';
import { CandidateService } from './candidate.service';
import { AppRequest } from '../../shared/middlewares/tenantContext.middleware';

const candidateService = new CandidateService();

export const addCandidate = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const result = await candidateService.addCandidate(tenantId, req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const moveCandidateStage = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const { id } = req.params;
        const { newStageId } = req.body;

        const result = await candidateService.moveCandidateStage(tenantId, id as string, newStageId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
