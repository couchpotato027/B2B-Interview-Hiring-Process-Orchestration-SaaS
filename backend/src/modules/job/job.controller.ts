import { Response, NextFunction } from 'express';
import { JobService } from './job.service';
import { AppRequest } from '../../shared/middlewares/tenantContext.middleware';

const jobService = new JobService();

export const createJob = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await jobService.createJob(req.user!.tenantId, req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

export const listJobs = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const status = req.query.status as string | undefined;
        const result = await jobService.listJobs(req.user!.tenantId, status);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getJob = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await jobService.getJob(req.user!.tenantId, req.params.id as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const updateJob = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await jobService.updateJob(req.user!.tenantId, req.params.id as string, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const archiveJob = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await jobService.archiveJob(req.user!.tenantId, req.params.id as string);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
