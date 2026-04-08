import { Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import { AppRequest } from '../../shared/middlewares/tenantContext.middleware';

const reportsService = new ReportsService();

export const getHiringFunnel = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await reportsService.getHiringFunnel(req.user!.tenantId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getStageDropoff = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await reportsService.getStageDropoff(req.user!.tenantId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getTimeToHireTrend = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await reportsService.getTimeToHireTrend(req.user!.tenantId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getOfferAcceptanceRate = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await reportsService.getOfferAcceptanceRate(req.user!.tenantId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
