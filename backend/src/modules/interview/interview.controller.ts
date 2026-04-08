import { Response, NextFunction } from 'express';
import { InterviewService } from './interview.service';
import { AppRequest } from '../../shared/middlewares/tenantContext.middleware';

const interviewService = new InterviewService();

export const scheduleInterview = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await interviewService.scheduleInterview(req.user!.tenantId, req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const listInterviews = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const filters = {
            candidateId: req.query.candidateId as string | undefined,
            interviewerId: req.query.interviewerId as string | undefined,
        };
        const result = await interviewService.listInterviews(req.user!.tenantId, filters);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const updateInterview = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await interviewService.updateInterview(req.user!.tenantId, req.params.id as string, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
