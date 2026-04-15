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
    res.status(201).json({
      id: user.getId(),
      email: user.getEmail(),
      name: user.getName(),
      role: user.getRole(),
      organizationId: user.getOrganizationId(),
    });
  } catch (error: any) {
    res.status(400).json({
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
    res.status(200).json(result);
  } catch (error: any) {
    console.error(`[DEBUG-CLEAN] Login FAILED for: ${email} - Error: ${error.message}`);
    res.status(401).json({
      message: error.message
    });
  }
});

router.get('/me', (req: Request, res: Response) => {
  const authReq = req as any;
  if (authReq.user) {
    return res.status(200).json({
      id: authReq.user.userId || authReq.user.id,
      email: authReq.user.email,
      role: authReq.user.role,
      organizationId: authReq.user.organizationId || authReq.user.tenantId
    });
  }
  return res.status(401).json({ message: 'Not authenticated' });
});

export { router as identityRouter };
