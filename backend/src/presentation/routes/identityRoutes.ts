import { Router, Request, Response } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const container = Container.getInstance();
  const useCase = container.resolve<RegisterUserUseCase>('RegisterUserUseCase');

  try {
    const user = await useCase.execute(req.body);
    return res.status(201).json({
      id: user.getId(),
      email: user.getEmail(),
      name: user.getName(),
      role: user.getRole(),
      organizationId: user.getOrganizationId(),
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message
    });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const container = Container.getInstance();
  const useCase = container.resolve<LoginUseCase>('LoginUseCase');
  const { email } = req.body;

  try {
    console.log(`[DEBUG-CLEAN] Login attempt for: ${email}`);
    const result = await useCase.execute(req.body);
    console.log(`[DEBUG-CLEAN] Login SUCCESS for: ${email}`);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`[DEBUG-CLEAN] Login FAILED for: ${email} - Error: ${error.message}`);
    return res.status(401).json({
      message: error.message
    });
  }
});

router.get('/me', (req: Request, res: Response) => {
  const authReq = req as any;
  
  // If auth middleware already ran, use its data
  if (authReq.user) {
    return res.status(200).json({
      id: authReq.user.userId || authReq.user.id,
      email: authReq.user.email,
      role: authReq.user.role,
      organizationId: authReq.user.organizationId || authReq.user.tenantId
    });
  }

  // Otherwise, decode JWT manually (since /auth is before authMiddleware)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'super-secret-key-for-sdproject';
      const decoded = jwt.verify(token, secret) as any;
      return res.status(200).json({
        id: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role,
        organizationId: decoded.organizationId || decoded.tenantId
      });
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }

  return res.status(401).json({ message: 'Not authenticated' });
});

router.patch('/preferences', async (req: Request, res: Response) => {
  const authReq = req as any;
  const userId = authReq.user?.userId || authReq.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { language } = req.body;
  if (!language) {
    return res.status(400).json({ message: 'Language is required' });
  }

  try {
    const { prisma } = require('../../infrastructure/database/prisma.client');
    await prisma.user.update({
      where: { id: userId },
      data: { language }
    });
    return res.status(200).json({ success: true, language });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export { router as identityRouter };
