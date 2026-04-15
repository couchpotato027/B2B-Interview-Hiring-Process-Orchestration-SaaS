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

export const listCandidates = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const filters = {
            status: req.query.status as string | undefined,
            pipelineId: req.query.pipelineId as string | undefined,
            jobId: req.query.jobId as string | undefined,
        };
        const result = await candidateService.listCandidates(tenantId, filters);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getCandidate = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const result = await candidateService.getCandidate(tenantId, req.params.id as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const updateCandidate = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const result = await candidateService.updateCandidate(tenantId, req.params.id as string, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const deleteCandidate = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const result = await candidateService.deleteCandidate(tenantId, req.params.id as string);
        res.json(result);
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

export const rejectCandidate = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const result = await candidateService.rejectCandidate(tenantId, req.params.id as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const hireCandidate = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const result = await candidateService.hireCandidate(tenantId, req.params.id as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const bulkUpdateCandidates = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user!.tenantId;
        const { candidateIds, action, payload } = req.body;
        const result = await candidateService.bulkUpdateCandidates(tenantId, candidateIds, action, payload);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
