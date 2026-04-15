import { Request, Response, NextFunction } from 'express';
import { GenerateHiringDashboardUseCase } from '../../application/use-cases/GenerateHiringDashboardUseCase';
import { GenerateJobReportUseCase } from '../../application/use-cases/GenerateJobReportUseCase';
import { ExportCandidateDataUseCase } from '../../application/use-cases/ExportCandidateDataUseCase';
import { AnalyticsService } from '../../application/services/AnalyticsService';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';
import { BaseController } from './BaseController';

export class AnalyticsController extends BaseController {
  constructor(
    private readonly dashboardUseCase: GenerateHiringDashboardUseCase,
    private readonly jobReportUseCase: GenerateJobReportUseCase,
    private readonly exportUseCase: ExportCandidateDataUseCase,
    private readonly analyticsService: AnalyticsService
  ) {
    super();
  }

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';

      const data = await this.dashboardUseCase.execute(organizationId);
      return this.rawOk(res, data);
    } catch (error) {
      return next(error);
    }
  }

  async getJobReport(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';
      const jobId = req.params.jobId as string;

      const data = await this.jobReportUseCase.execute(jobId, organizationId);
      return this.rawOk(res, data);
    } catch (error) {
      return next(error);
    }
  }

  async getFunnel(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';
      const pipelineId = req.params.pipelineId as string;

      const data = await this.analyticsService.calculateConversionFunnel(pipelineId, organizationId);
      return this.rawOk(res, data);
    } catch (error) {
      return next(error);
    }
  }

  async getSkillsReport(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';

      const data = await this.analyticsService.generateSkillsReport(organizationId);
      return this.rawOk(res, data);
    } catch (error) {
      return next(error);
    }
  }

  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const organizationId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant-id';

      const csv = await this.exportUseCase.execute(organizationId, req.body);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=candidates.csv');
      return res.status(200).send(csv);
    } catch (error) {
      return next(error);
    }
  }
}
