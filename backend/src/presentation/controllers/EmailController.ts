import type { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { emailService } from '../../infrastructure/services/EmailService';
import { addEmailToQueue } from '../../infrastructure/queues/EmailQueue';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';

export class EmailController extends BaseController {
  constructor() {
    super();
  }

  public getTemplates = async (req: Request, res: Response) => {
    // Predefined templates
    const templates = [
      { id: 'app_received', name: 'Application Received', subject: 'We received your application for {{jobTitle}}' },
      { id: 'stage_moved', name: 'Stage Transition', subject: 'Your application status has been updated' },
      { id: 'interview_invitation', name: 'Interview Invitation', subject: 'Interview invitation for {{jobTitle}}' },
      { id: 'job_offer', name: 'Job Offer', subject: 'Job offer from {{companyName}}' },
      { id: 'rejection', name: 'Rejection (Polite)', subject: 'Update on your application for {{jobTitle}}' },
      { id: 'recruiter_assigned', name: 'Recruiter Assignment', subject: 'New candidates assigned to you' },
    ];
    return this.rawOk(res, templates);
  };

  public sendEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant-id';
      const { to, subject, body, candidateId } = req.body;

      if (!to || !subject || !body) {
        return this.badRequest(res, 'Missing to, subject, or body');
      }

      await addEmailToQueue({
        tenantId,
        candidateId,
        userId: authReq.user?.userId,
        to,
        subject,
        body,
      });

      return this.rawOk(res, { success: true, message: 'Email queued' });
    } catch (error) {
      return next(error);
    }
  };

  public bulkSend = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant-id';
      const { candidates, subject, bodyTemplate } = req.body;

      if (!candidates || !Array.isArray(candidates)) {
        return this.badRequest(res, 'Candidates array is required');
      }

      for (const candidate of candidates) {
          // Simple variable replacement
          let body = bodyTemplate
            .replace(/\{\{candidateName\}\}/g, `${candidate.firstName} ${candidate.lastName}`)
            .replace(/\{\{jobTitle\}\}/g, candidate.jobTitle || 'our position');

          await addEmailToQueue({
            tenantId,
            candidateId: candidate.id,
            userId: authReq.user?.userId,
            to: candidate.email,
            subject: subject.replace(/\{\{jobTitle\}\}/g, candidate.jobTitle || 'our position'),
            body,
          });
      }

      return this.rawOk(res, { success: true, count: candidates.length });
    } catch (error) {
      return next(error);
    }
  };

  public getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as unknown as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || 'default-tenant-id';
      const history = await emailService.getHistory(req.params.candidateId as string, tenantId);
      return this.rawOk(res, history);
    } catch (error) {
      return next(error);
    }
  };
}
