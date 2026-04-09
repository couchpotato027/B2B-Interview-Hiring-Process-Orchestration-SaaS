import { Request, Response, NextFunction } from 'express';
import { GenerateHiringDashboardUseCase } from '../../application/use-cases/GenerateHiringDashboardUseCase';
import { GenerateJobReportUseCase } from '../../application/use-cases/GenerateJobReportUseCase';
import { ExportCandidateDataUseCase } from '../../application/use-cases/ExportCandidateDataUseCase';
import { AnalyticsService } from '../../application/services/AnalyticsService';

export class AnalyticsController {
  constructor(
    private readonly dashboardUseCase: GenerateHiringDashboardUseCase,
    private readonly jobReportUseCase: GenerateJobReportUseCase,
    private readonly exportUseCase: ExportCandidateDataUseCase,
    private readonly analyticsService: AnalyticsService
  ) {}

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.dashboardUseCase.execute();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getJobReport(req: Request, res: Response, next: NextFunction) {
    try {
      const jobId = req.params.jobId as string;
      const data = await this.jobReportUseCase.execute(jobId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getFunnel(req: Request, res: Response, next: NextFunction) {
    try {
      const pipelineId = req.params.pipelineId as string;
      const data = await this.analyticsService.calculateConversionFunnel(pipelineId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getSkillsReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.analyticsService.generateSkillsReport();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await this.exportUseCase.execute(req.body);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=candidates.csv');
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}
