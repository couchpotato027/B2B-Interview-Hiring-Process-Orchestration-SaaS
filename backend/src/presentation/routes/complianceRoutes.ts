import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.client';
import { auditService } from '../../modules/audit/audit.service';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';

const complianceRouter = Router();

const getTenantId = (req: Request) => 
  (req as unknown as AuthenticatedRequest).user?.organizationId || 'default-tenant-id';

/**
 * POST /compliance/export-data
 * Exports all data for a specific candidate (GDPR Right to Data Portability)
 */
complianceRouter.post('/export-data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { candidateId } = req.body;
    const tenantId = getTenantId(req);
    const userId = (req as unknown as AuthenticatedRequest).user?.id;

    if (!candidateId) return res.status(400).json({ message: 'candidateId is required' });

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, tenantId },
      include: {
        evaluations: true,
        interviews: true,
        slaAlerts: true,
        job: true,
      }
    });

    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    // Log the export action
    await auditService.log({
      tenantId,
      userId: userId || null,
      action: 'EXPORT',
      resource: 'Candidate',
      resourceId: candidateId,
      changes: { type: 'GDPR_DATA_PORTABILITY_EXPORT' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return res.status(200).json(candidate);
  } catch (err) { next(err); }
});

/**
 * POST /compliance/delete-data
 * Anonymizes candidate data (GDPR Right to be Forgotten)
 */
complianceRouter.post('/delete-data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { candidateId } = req.body;
    const tenantId = getTenantId(req);
    const userId = (req as unknown as AuthenticatedRequest).user?.id;

    if (!candidateId) return res.status(400).json({ message: 'candidateId is required' });

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, tenantId },
    });

    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    // Anonymize personal data
    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        firstName: 'Deleted',
        lastName: 'User',
        email: `deleted-candidate-${candidateId}@hireflow.com`,
        resumeUrl: null,
        status: 'ARCHIVED',
      }
    });

    // Log the deletion/anonymization action
    await auditService.log({
      tenantId,
      userId: userId || null,
      action: 'DELETE',
      resource: 'Candidate',
      resourceId: candidateId,
      changes: { type: 'GDPR_RIGHT_TO_BE_FORGOTTEN_ANONYMIZATION' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return res.status(200).json({ message: 'Candidate data has been anonymized successfully' });
  } catch (err) { next(err); }
});

export { complianceRouter };
