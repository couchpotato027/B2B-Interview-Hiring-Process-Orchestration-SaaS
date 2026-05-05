import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma.client';
import { AuthenticatedRequest } from '../../infrastructure/middleware/AuthMiddleware';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = authReq.user?.organizationId || 'default-tenant';
    
    const logs = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    return res.status(200).json(logs);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export { router as auditRouter };
