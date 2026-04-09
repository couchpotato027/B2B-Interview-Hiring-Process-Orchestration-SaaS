import { prisma } from '../../infrastructure/database/prisma.client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../shared/errors/DomainErrors';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export class AuthService {
    async registerTenant(companyName: string, adminEmail: string, adminPassword: string, firstName?: string, lastName?: string) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        return await prisma.$transaction(async (tx) => {
            // 1. Create Tenant
            const tenant = await tx.tenant.create({
                data: { name: companyName },
            });

            // 2. Create Roles
            const adminRole = await tx.role.create({
                data: { tenantId: tenant.id, name: 'ADMIN' },
            });

            await tx.role.createMany({
                data: [
                    { tenantId: tenant.id, name: 'RECRUITER' },
                    { tenantId: tenant.id, name: 'INTERVIEWER' },
                ],
            });

            // 3. Create Admin User
            const adminUser = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    roleId: adminRole.id,
                    email: adminEmail,
                    passwordHash: hashedPassword,
                    firstName: firstName || '',
                    lastName: lastName || '',
                },
            });

            return { tenant, adminUser };
        });
    }

    async login(email: string, password: string) {
        const user = await prisma.user.findFirst({
            where: { email },
            include: { role: true },
        });

        if (!user) throw new UnauthorizedError('Invalid credentials');

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) throw new UnauthorizedError('Invalid credentials');

        const payload = {
            id: user.id,
            tenantId: user.tenantId,
            role: user.role.name,
            email: user.email,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN as any });
        return { token, user: { ...payload, firstName: user.firstName, lastName: user.lastName } };
    }

    async getMe(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true, tenant: { select: { id: true, name: true } } },
        });
        if (!user) throw new NotFoundError('User not found');

        return {
            id: user.id,
            tenantId: user.tenantId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role.name,
            tenant: user.tenant,
        };
    }

    async listUsers(tenantId: string) {
        return prisma.user.findMany({
            where: { tenantId },
            select: { id: true, email: true, firstName: true, lastName: true, role: { select: { name: true } }, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createUser(tenantId: string, data: { email: string; password: string; firstName?: string; lastName?: string; roleName: string }) {
        const role = await prisma.role.findFirst({ where: { tenantId, name: data.roleName } });
        if (!role) throw new ValidationError(`Role ${data.roleName} not found`);

        const existing = await prisma.user.findFirst({ where: { tenantId, email: data.email } });
        if (existing) throw new ValidationError('User with this email already exists');

        const hashedPassword = await bcrypt.hash(data.password, 10);

        return prisma.user.create({
            data: {
                tenantId,
                roleId: role.id,
                email: data.email,
                passwordHash: hashedPassword,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
            },
            select: { id: true, email: true, firstName: true, lastName: true, role: { select: { name: true } }, createdAt: true },
        });
    }
}
