import { Router, Request, Response } from 'express';
import { Container } from '../../infrastructure/di/Container';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { OAuth2Client } from 'google-auth-library';

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

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google-login', async (req: Request, res: Response) => {
  const { idToken } = req.body;
  const { prisma } = require('../../infrastructure/database/prisma.client');
  const jwt = require('jsonwebtoken');

  if (!idToken) {
    return res.status(400).json({ message: 'idToken is required' });
  }

  try {
    // Verify Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const { email, sub: googleId, given_name: firstName, family_name: lastName } = payload;

    // Find user by email or googleId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { googleId }
        ]
      },
      include: { role: true, tenant: true }
    });

    if (!user) {
      // If user doesn't exist, create them in a default tenant
      const defaultTenant = await prisma.tenant.findFirst() || await prisma.tenant.create({ data: { name: 'Default Organization' } });
      const defaultRole = await prisma.role.findFirst({ where: { tenantId: defaultTenant.id, name: 'ADMIN' } }) 
                         || await prisma.role.create({ data: { tenantId: defaultTenant.id, name: 'ADMIN' } });

      user = await prisma.user.create({
        data: {
          email,
          googleId,
          firstName: firstName || '',
          lastName: lastName || '',
          tenantId: defaultTenant.id,
          roleId: defaultRole.id,
        },
        include: { role: true, tenant: true }
      });
    } else if (!user.googleId) {
      // Link Google account to existing email account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
        include: { role: true, tenant: true }
      });
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role.name, 
        organizationId: user.tenantId,
        tenantId: user.tenantId
      },
      secret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        tenant: { id: user.tenant.id, name: user.tenant.name }
      }
    });
  } catch (error: any) {
    console.error('Google Login Error:', error);
    return res.status(401).json({ message: 'Google authentication failed' });
  }
});


router.get('/me', async (req: Request, res: Response) => {
  const { prisma } = require('../../infrastructure/database/prisma.client');

  // The auth middleware (or dev bypass) always sets req.user
  const authReq = req as any;
  const userId = authReq.user?.userId || authReq.user?.id;

  if (!userId || userId === 'system') {
    // Fallback: try to decode token manually
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev';
        const decoded = jwt.verify(token, secret) as any;
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.userId || decoded.id },
          include: { role: true, tenant: true }
        });
        if (dbUser) {
          return res.status(200).json({
            id: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            role: dbUser.role.name,
            tenant: { id: dbUser.tenant.id, name: dbUser.tenant.name }
          });
        }
      } catch (e) {}
    }
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Fetch full user details from DB using the middleware-injected userId
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, tenant: true }
    });
    if (dbUser) {
      return res.status(200).json({
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role.name,
        tenant: { id: dbUser.tenant.id, name: dbUser.tenant.name }
      });
    }
  } catch (e) {
    console.error('[/me] DB lookup error:', e);
  }

  return res.status(401).json({ message: 'Not authenticated' });
});

router.get('/users', async (req: Request, res: Response) => {
  const { prisma } = require('../../infrastructure/database/prisma.client');
  const authReq = req as any;
  const tenantId = authReq.user?.organizationId || authReq.user?.tenantId || 'default-tenant';

  try {
    const users = await prisma.user.findMany({
      where: { tenantId },
      include: { role: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(users);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/users', async (req: Request, res: Response) => {
  const { prisma } = require('../../infrastructure/database/prisma.client');
  const bcrypt = require('bcryptjs');
  const authReq = req as any;
  const tenantId = authReq.user?.organizationId || authReq.user?.tenantId || 'default-tenant';

  const { email, password, firstName, lastName, roleName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'email, password, firstName, lastName are required.' });
  }

  try {
    // Check if email already exists
    const existing = await prisma.user.findFirst({ where: { email, tenantId } });
    if (existing) {
      return res.status(409).json({ message: 'A user with this email already exists in your organization.' });
    }

    // Find or default to the requested role
    const role = await prisma.role.findFirst({ where: { tenantId, name: roleName || 'RECRUITER' } });
    if (!role) {
      return res.status(400).json({ message: `Role "${roleName || 'RECRUITER'}" not found for this organization.` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        tenantId,
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        roleId: role.id,
      },
      include: { role: { select: { name: true } } },
    });

    return res.status(201).json(user);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }
    return res.status(500).json({ message: error.message });
  }
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
