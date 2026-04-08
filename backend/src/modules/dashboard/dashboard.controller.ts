import { Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { AppRequest } from '../../shared/middlewares/tenantContext.middleware';

const dashboardService = new DashboardService();

export const getStats = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await dashboardService.getStats(req.user!.tenantId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getRecentAlerts = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await dashboardService.getRecentAlerts(req.user!.tenantId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getPendingEvaluations = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        const result = await dashboardService.getPendingEvaluations(req.user!.tenantId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
