import { Request, Response, NextFunction } from 'express';
import { BaseController } from './BaseController';
import { prisma } from '../../infrastructure/database/prisma.client';
import { auditService } from '../../application/services/AuditService';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';

export class ComplianceController extends BaseController {
  
  /**
   * GDPR: Right to be Forgotten (Anonymization)
   */
  public deleteData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);
      const { candidateId } = req.body;

      if (!candidateId) return this.badRequest(res, 'candidateId is required');

      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId, tenantId }
      });

      if (!candidate) return this.notFound(res, 'Candidate not found');

      // Anonymize instead of hard delete for audit integrity
      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          firstName: 'DELETED',
          lastName: 'USER',
          email: `${candidateId}@deleted.hireflow.ai`,
          phone: 'N/A',
          resumeUrl: null,
          status: 'ARCHIVED'
        } as any
      });

      // Also delete or anonymize related sensitive data
      await prisma.evaluation.deleteMany({ where: { candidateId } });
      await prisma.interview.deleteMany({ where: { candidateId } });

      await auditService.log({
        tenantId,
        userId: authReq.user?.userId,
        action: 'DELETE',
        resource: 'Candidate',
        resourceId: candidateId,
        changes: { reason: 'GDPR_RIGHT_TO_BE_FORGOTTEN' },
        ipAddress: req.ip
      });

      return this.ok(res, { success: true, message: 'Candidate data anonymized successfully.' });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GDPR: Data Portability (Export)
   */
  public exportData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);
      const { candidateId } = req.body;

      const data = await prisma.candidate.findUnique({
        where: { id: candidateId, tenantId },
        include: {
          evaluations: true,
          interviews: true
        }
      });

      if (!data) return this.notFound(res, 'Candidate not found');

      await auditService.log({
        tenantId,
        userId: authReq.user?.userId,
        action: 'EXPORT',
        resource: 'Candidate',
        resourceId: candidateId,
        ipAddress: req.ip
      });

      // In a real app, generate a ZIP or JSON file and return download link
      return this.ok(res, { data });
    } catch (error) {
      return next(error);
    }
  };

  public getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const tenantId = authReq.user?.organizationId || (req.headers['x-organization-id'] as string);
      
      const result = await auditService.getLogs(tenantId, req.query);
      return this.ok(res, result);
    } catch (error) {
      return next(error);
    }
  };
}
