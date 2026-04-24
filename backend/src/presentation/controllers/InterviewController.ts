import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { Container } from '../../infrastructure/di/Container';
import { ScheduleInterviewUseCase } from '../../application/use-cases/ScheduleInterviewUseCase';
import { SubmitFeedbackUseCase } from '../../application/use-cases/SubmitFeedbackUseCase';
import { IInterviewRepository } from '../../domain/repositories/IInterviewRepository';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';

export class InterviewController extends BaseController {
  private get scheduleUseCase() {
    return Container.getInstance().resolve<ScheduleInterviewUseCase>('ScheduleInterviewUseCase');
  }
  private get submitFeedbackUseCase() {
    return Container.getInstance().resolve<SubmitFeedbackUseCase>('SubmitFeedbackUseCase');
  }
  private get interviewRepository() {
    return Container.getInstance().resolve<IInterviewRepository>('InterviewRepository');
  }

  public schedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant';

      const result = await this.scheduleUseCase.execute({
        ...req.body,
        tenantId
      });

      if (!result.success) {
        return this.badRequest(res, result.error as string, result.code);
      }

      return this.created(res, result.data);
    } catch (error) {
      return next(error);
    }
  };

  public submitFeedback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant';

      const result = await this.submitFeedbackUseCase.execute({
        interviewId: req.params.id as string,
        feedback: req.body.feedback,
        tenantId
      });

      if (!result.success) {
        return this.badRequest(res, result.error as string, result.code);
      }

      return this.ok(res, { success: true });
    } catch (error) {
      return next(error);
    }
  };

  public getCandidateInterviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthenticatedRequest;
        const tenantId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string) || 'default-tenant';

        const interviews = await this.interviewRepository.findByCandidateId(req.params.candidateId as string, tenantId);
        return this.ok(res, interviews);
    } catch (error) {
        return next(error);
    }
  };

  public getAvailability = async (req: Request, res: Response, next: NextFunction) => {
      // Mock for now or implement direct interviewer schedule fetch
      return this.ok(res, { available: true });
  }
}
