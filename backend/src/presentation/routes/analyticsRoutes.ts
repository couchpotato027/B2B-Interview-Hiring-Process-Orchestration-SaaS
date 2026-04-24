import { Router, Request, Response, NextFunction } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { Container } from '../../infrastructure/di/Container';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';
import { AnalyticsService } from '../../application/services/AnalyticsService';

const analyticsRouter = Router();
const container = Container.getInstance();

const getController = () => {
  return new AnalyticsController(
    container.resolve('GenerateHiringDashboardUseCase'),
    container.resolve('GenerateJobReportUseCase'),
    container.resolve('ExportCandidateDataUseCase'),
    container.resolve('AnalyticsService')
  );
};

// Dashboard Integrated Stats
analyticsRouter.get('/dashboard/metrics', async (req, res, next) => {
    try {
        const authReq = req as unknown as AuthenticatedRequest;
        const organizationId = authReq.user?.organizationId || 'default-tenant-id';
        const dateRange = req.query.dateRange as string || '30d';
        const service = container.resolve<AnalyticsService>('AnalyticsService');
        
        const metrics = await service.getDashboardMetrics(organizationId, dateRange);
        res.status(200).json(metrics);
    } catch (e) { return next(e); }
});

analyticsRouter.get('/dashboard/trends', async (req, res, next) => {
    try {
        const authReq = req as unknown as AuthenticatedRequest;
        const organizationId = authReq.user?.organizationId || 'default-tenant-id';
        const metric = req.query.metric as string || 'timeToHire';
        const dateRange = req.query.dateRange as string || '6m';
        const service = container.resolve<AnalyticsService>('AnalyticsService');
        
        if (metric === 'timeToHire') {
            const data = await service.getTimeToHireTrend(organizationId, dateRange);
            return res.status(200).json(data);
        }
        
        res.status(400).json({ message: 'Invalid metric' });
    } catch (e) { return next(e); }
});

// Legacy /stats support for existing frontend code
analyticsRouter.get('/stats', async (req, res, next) => {
    try {
        const authReq = req as unknown as AuthenticatedRequest;
        const organizationId = authReq.user?.organizationId || 'default-tenant-id';
        const service = container.resolve<AnalyticsService>('AnalyticsService');
        const metrics = await service.getDashboardMetrics(organizationId, '30d');
        
        res.status(200).json({
            totalHired: metrics.offersAccepted.count,
            activeCandidates: metrics.activeCandidates.count,
            pendingAlerts: metrics.slaBreaches.count,
            offersAccepted: metrics.offersAccepted.count,
            avgTimeToHireDays: metrics.timeToHire.avgDays,
        });
    } catch (e) { return next(e); }
});

// Reports
analyticsRouter.get('/funnel', async (req, res, next) => {
    try {
        const authReq = req as unknown as AuthenticatedRequest;
        const organizationId = authReq.user?.organizationId || 'default-tenant-id';
        const pipelineRepo = container.resolve<any>('PipelineRepository');
        const pipelines = await pipelineRepo.findAll(organizationId);
        const pipelineId = req.query.pipelineId as string || (pipelines[0]?.getId());
        
        if (!pipelineId) return res.status(200).json([]);
        
        const service = container.resolve<AnalyticsService>('AnalyticsService');
        const data = await service.calculateConversionFunnel(pipelineId, organizationId);
        return res.status(200).json(data.stages || []); 
    } catch (e) { return next(e); }
});

analyticsRouter.get('/time-to-hire', async (req, res, next) => {
    try {
        const authReq = req as unknown as AuthenticatedRequest;
        const organizationId = authReq.user?.organizationId || 'default-tenant-id';
        const service = container.resolve<AnalyticsService>('AnalyticsService');
        const data = await service.getTimeToHireTrend(organizationId, '6m');
        res.status(200).json(data);
    } catch (e) { return next(e); }
});

analyticsRouter.get('/dropoff', async (req, res, next) => {
    try {
        const authReq = req as unknown as AuthenticatedRequest;
        const organizationId = authReq.user?.organizationId || 'default-tenant-id';
        const pipelineRepo = container.resolve<any>('PipelineRepository');
        const pipelines = await pipelineRepo.findAll(organizationId);
        const pipelineId = req.query.pipelineId as string || (pipelines[0]?.getId());
        
        if (!pipelineId) return res.status(200).json([]);

        const service = container.resolve<AnalyticsService>('AnalyticsService');
        const data = await service.calculateConversionFunnel(pipelineId, organizationId);
        
        const dropoffData = data.stages.map(s => ({
            stageName: s.stageName,
            dropoffRate: Math.round(s.dropOffPercent)
        }));
        
        res.status(200).json(dropoffData);
    } catch (e) { return next(e); }
});

analyticsRouter.get('/offer-rate', async (req, res, next) => {
    try {
        const authReq = req as unknown as AuthenticatedRequest;
        const organizationId = authReq.user?.organizationId || 'default-tenant-id';
        const service = container.resolve<AnalyticsService>('AnalyticsService');
        const metrics = await service.getDashboardMetrics(organizationId, '30d');
        
        res.status(200).json({ 
            acceptedOffers: metrics.offersAccepted.count, 
            rejectedOffers: metrics.offersAccepted.total - metrics.offersAccepted.count, 
            totalOffers: metrics.offersAccepted.total 
        });
    } catch (e) { return next(e); }
});

// Job Analytics
analyticsRouter.get('/job/:jobId', (req, res, next) => getController().getJobReport(req, res, next));

// System Analytics
analyticsRouter.get('/skills', (req, res, next) => getController().getSkillsReport(req, res, next));
analyticsRouter.post('/export', (req, res, next) => getController().exportData(req, res, next));

export { analyticsRouter };
